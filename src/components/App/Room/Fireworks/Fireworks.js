import { React, useEffect } from "react";
import { Fireworks as FW } from 'fireworks/lib/react'

const fireTime = 10000

const Fireworks = ({ setShow }) => {
  let fxProps = {
    count: 2,
    interval: 1000,
    colors: ['#ffffff', '#00bbaa', '#0000FF'],
    calc: (props, i) => ({
      ...props,
      x: (i + 1) * (window.innerWidth / 3) - (i + 1) * 100,
      y: 200 + Math.random() * 100 - 50 + (i === 2 ? -80 : 0)
    })
  }
  useEffect(() => {
    let timer = setTimeout(() => setShow(false), fireTime);
    return () => {
      clearTimeout(timer);
    }
  }, [])
  return (
    <FW {...fxProps} />
  )
}

export default Fireworks;