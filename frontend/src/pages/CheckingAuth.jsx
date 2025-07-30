import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function CheckingAuthPage() {
    const { isAuthenticated, isLoading } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        // Only redirect once loading is complete
        if (!isLoading) {
            console.log('🛡️ CheckingAuthPage - Auth check complete')
            console.log('🛡️ CheckingAuthPage - isAuthenticated:', isAuthenticated)

            if (isAuthenticated) {
                // Get intended path from sessionStorage or default to /assistant
                const redirectPath = sessionStorage.getItem('intendedPath') || '/assistant'
                sessionStorage.removeItem('intendedPath')
                console.log('🛡️ CheckingAuthPage - Redirecting authenticated user to:', redirectPath)
                navigate(redirectPath, { replace: true })
            } else {
                console.log('🛡️ CheckingAuthPage - Redirecting unauthenticated user to /signin')
                navigate('/signin', { replace: true })
            }
        }
    }, [isLoading, isAuthenticated, navigate])

    return (
        <div className="min-h-screen bg-white dark:bg-background flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto space-x-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                </div>

                <p className="text-gray-600 dark:text-gray-400">
                    {isLoading ? '' : 'Redirecting...'}
                </p>
            </div>
        </div>
    )
}