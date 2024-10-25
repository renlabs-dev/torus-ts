"use client"

import { DateTime } from "luxon"
import { useEffect, useState } from "react"

export const PostDate = (props: { date: Date, className: string }) => {
  const { date, className } = props
  const [formattedDate, setFormattedDate] = useState<string>('Loading...')

  useEffect(() => {
    setFormattedDate(DateTime.fromJSDate(date).toFormat(" LLL dd, yyyy HH:mm"))
  }, [date])

  return (
    <p className={`${className || "text-white"}`}>
      {formattedDate}
    </p>
  )
}