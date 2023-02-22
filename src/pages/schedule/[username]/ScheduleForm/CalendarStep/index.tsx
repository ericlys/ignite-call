import { Calendar } from '@/components/Calendar'
import { api } from '@/lib/axios'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Container,
  TimePicker,
  TimePickerHeader,
  TimePickerItem,
  TimePickerList,
} from './styled'

interface Availability {
  possibleTimes: number[]
  unavailableTimes: number[]
}

interface CalendarStepProps {
  onSelectDateTime: (date: Date) => void
}

export function CalendarStep({ onSelectDateTime }: CalendarStepProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const router = useRouter()

  const isDateSelected = !!selectedDate
  const username = String(router.query.username)

  const weekDay = selectedDate ? dayjs(selectedDate).format('dddd') : null
  const describedDate = selectedDate
    ? dayjs(selectedDate).format('DD[ de ]MMMM')
    : null

  const selectedDateWithouTime = selectedDate
    ? dayjs(selectedDate).format('YYYY-MM-DD')
    : null

  const { data: availability } = useQuery<Availability>(
    ['availability', selectedDateWithouTime],
    async () => {
      const response = await api.get(`/users/${username}/availability`, {
        params: {
          date: selectedDateWithouTime,
        },
      })

      return response.data
    },
    {
      enabled: !!selectedDate,
    },
  )

  function handleSelectedTime(hour: number) {
    const dateWithTime = dayjs(selectedDate)
      .set('hour', hour)
      .startOf('hour')
      .toDate()

    onSelectDateTime(dateWithTime)
  }

  const unavailableTimes = availability?.unavailableTimes.map(
    (unavailableTime) => {
      return dayjs(unavailableTime).get('hour')
    },
  )

  const availableTimes = availability?.possibleTimes.filter((availableTime) => {
    return (
      !unavailableTimes?.includes(availableTime) &&
      !dayjs(selectedDate).set('hour', availableTime).isBefore(new Date())
    )
  })

  return (
    <Container isTimePickerOpen={isDateSelected}>
      <Calendar selectedDate={selectedDate} onDateSelected={setSelectedDate} />

      {isDateSelected && (
        <TimePicker>
          <TimePickerHeader>
            {weekDay} <span>{describedDate}</span>
          </TimePickerHeader>

          <TimePickerList>
            {availability?.possibleTimes.map((hour) => {
              return (
                <TimePickerItem
                  key={hour}
                  onClick={() => handleSelectedTime(hour)}
                  disabled={!availableTimes?.includes(hour)}
                >
                  {String(hour).padStart(2, '0')}:00h
                </TimePickerItem>
              )
            })}
          </TimePickerList>
        </TimePicker>
      )}
    </Container>
  )
}
