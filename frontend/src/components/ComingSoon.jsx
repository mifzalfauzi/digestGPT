"use client"

import React from "react"
import { Link } from "react-router-dom" // Import Link for navigation

import { useState, useEffect } from "react"
import { Mail, Github, Twitter, Linkedin, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import ThemeToggle from "@/components/ThemeToggle" // Import the new ThemeToggle component
import { Typewriter } from "react-simple-typewriter"

export default function ComingSoonPage() {
    const [email, setEmail] = useState("")
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [countdown, setCountdown] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    })

    // Set fixed launch date: August 25, 2025 at 00:00:00
    useEffect(() => {
        const launchDate = new Date("2025-08-25T00:00:00")

        const timer = setInterval(() => {
            const now = new Date()
            const difference = launchDate.getTime() - now.getTime()

            if (difference <= 0) {
                clearInterval(timer)
                setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
                return
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24))
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((difference % (1000 * 60)) / 1000)

            setCountdown({ days, hours, minutes, seconds })
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        // Here you would typically send the email to your backend
        console.log("Email submitted:", email)
        setIsSubmitted(true)
        setTimeout(() => setIsSubmitted(false), 3000)
        setEmail("")
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center dark:bg-[#121212] p-4 relative overflow-hidden">
            {/* Theme Toggle and Landing Page Button */}
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                {/* <Link to="/main">
          <Button variant="outline" className="whitespace-nowrap bg-transparent">
            View Landing Page
          </Button>
        </Link> */}
                <ThemeToggle />
            </div>

            <div className="w-full max-w-3xl text-center space-y-8 animate-in fade-in duration-1000">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight animate-in slide-in-from-top-4 duration-1000 ease-out">
                    Something Amazing is
                    <br className="">
                    </br>
                    <span className="text-primary"><Typewriter
                        words={["Coming Soon", "Powered by Claude", "Gearing Up",]}
                        loop={true}
                        cursor={true}
                        cursorStyle="|"
                        typeSpeed={100}
                        deleteSpeed={100}
                        delaySpeed={800} /></span>
                </h1>

                <p className="text-xl text-muted-foreground max-w-xl mx-auto animate-in slide-in-from-bottom-4 duration-1000 ease-out delay-200">
                    We're working hard to bring you something helpful. 
                </p>
                <p className="text-xl text-muted-foreground max-w-xl mx-auto animate-in slide-in-from-bottom-4 duration-1000 ease-out delay-300">
                    Feel free to explore our <Link to="/main" className="text-primary hover:underline">landing page</Link> in the meantime.
                </p>

                <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto animate-in zoom-in duration-1000 delay-400">
                    {Object.entries(countdown).map(([unit, value]) => (
                        <Card key={unit} className="p-4 flex flex-col items-center justify-center dark:bg-[#1f1f1f]">
                            <span className="text-3xl font-bold">{value}</span>
                            <span className="text-xs text-muted-foreground capitalize">{unit}</span>
                        </Card>
                    ))}
                </div>

                {/* <div className="max-w-md mx-auto animate-in fade-in duration-1000 delay-600">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-grow"
            />
            <Button type="submit" className="whitespace-nowrap">
              Notify Me <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
          {isSubmitted && <p className="mt-2 text-sm text-green-600">Thanks! We'll notify you when we launch.</p>}
        </div> */}

                <div className="flex justify-center gap-6 mt-8 animate-in fade-in duration-1000 delay-800">
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                        <Twitter className="h-6 w-6" />
                        <span className="sr-only">Twitter</span>
                    </a>
                    <a
                        href="https://github.com/mifzalfauzi/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Github className="h-6 w-6" />
                        <span className="sr-only">GitHub</span>
                    </a>
                    <a
                        href="https://www.linkedin.com/in/mifzal/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Linkedin className="h-6 w-6" />
                        <span className="sr-only">LinkedIn</span>
                    </a>
                    <a
                        href="mailto:mifzal.aqil@gmail.com"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Mail className="h-6 w-6" />
                        <span className="sr-only">Email</span>
                    </a>
                </div>
            </div>
        </div>
    )
}
