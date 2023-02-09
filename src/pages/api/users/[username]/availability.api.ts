import { prisma } from '@/lib/prisma'
import dayjs from 'dayjs'
import { NextApiRequest, NextApiResponse } from 'next'

// http://localhost:3000/api/users/ericlys/availability?date=2023-2-6
export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).end()
  }

  const username = String(req.query.username)
  const { date } = req.query

  if (!date) {
    return res.status(400).json({ message: 'Date not provided.' })
  }

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  })

  if (!user) {
    return res.status(400).json({ message: 'User does not exist.' })
  }

  const referenceDate = dayjs(String(date))
  const isPastDate = referenceDate.endOf('day').isBefore(new Date())

  if (isPastDate) {
    return res.json({ possibleTimes: [], availableTimes: [] })
  }

  // TimeInterval
  // checks if the user has available time on that day
  const userAvailability = await prisma.userTimeInterval.findFirst({
    where: {
      user_id: user.id,
      week_day: referenceDate.get('day'),
    },
  })

  if (!userAvailability) {
    return res.json({ possibleTimes: [], availableTimes: [] })
  }

  const { time_start_in_minutes, time_end_in_minutes } = userAvailability

  const startHour = time_start_in_minutes / 60 // 10
  const endHour = time_end_in_minutes / 60 // 18

  // [10, 11, 12, 13, 14, 15, 16, 17]
  const possibleTimes = Array.from({ length: endHour - startHour }).map(
    (_, i) => {
      return startHour + i
    },
  )

  /* now we check in the database that one of the schedules is already 
  busy */

  const blockedTimes = await prisma.scheduling.findMany({
    select: {
      date: true,
    },
    where: {
      user_id: user.id,
      date: {
        gte: referenceDate.set('hour', startHour).toDate(), // greater than or equal
        lte: referenceDate.set('hour', endHour).toDate(),
      },
    },
  })

  /* 
    problem: returns the available times, however, as they were formatted on the server side, the server's local time can disturb this formatting
   */
  // const availableTimes = possibleTimes.filter((time) => {
  //   const isTimeBlocked = blockedTimes.some(
  //     (blockedTime) => blockedTime.date.getHours() === time,
  //   )

  //   const isTimeInPast = referenceDate.set('hour', time).isBefore(new Date())

  //   return !isTimeBlocked && !isTimeInPast
  // })

  /* 
    solution: return the schedules that exist scheduling so that they are formatted on the client side
   */
  const unavailableTimes = blockedTimes.map((schedules) => {
    return schedules.date
  })

  return res.json({ possibleTimes, unavailableTimes })
}
