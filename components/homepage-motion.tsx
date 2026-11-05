'use client'
import {createContext, useContext} from 'react'
export const HomepageMotionContext = createContext({paused:false, optIn:false})
export const useHomepageMotion = () => useContext(HomepageMotionContext)
