import { useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalBody, ModalFooter, ModalCloseButton } from './ui/modal'
import { CheckCircle, AlertCircle, Send, ArrowLeft, Mail, FileText, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

function SendTicket() {
    const [searchParams] = useSearchParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [message, setMessage] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [modalContent, setModalContent] = useState({ type: '', title: '', message: '' })
    const BASE_URL = import.meta.env.VITE_API_BASE_URL

    const docId = searchParams.get('docId')

    const handleSendTicket = async () => {
        if (!message.trim()) {
            toast.error('Please enter a message before sending the ticket')
            return
        }

        if (!user?.email) {
            toast.error('Please sign in to send a ticket')
            navigate('/signin')
            return
        }

        if (!docId) {
            toast.error('Document ID is missing')
            return
        }

        setIsLoading(true)

        try {
            const response = await axios.post(`${BASE_URL}/send-ticket`, {
                docId: docId,
                email: user.email,
                message: message.trim()
            })

            if (response.status === 200) {
                setModalContent({
                    type: 'success',
                    title: 'Ticket Sent Successfully!',
                    message: 'Your support ticket has been submitted. Our team will review your request and get back to you soon.'
                })
                setIsModalOpen(true)
                setMessage('') // Clear the form
                toast.success('Ticket sent successfully!')
            }
        } catch (error) {
            console.error('Error sending ticket:', error)
            
            if (error.response?.status === 401) {
                setModalContent({
                    type: 'error',
                    title: 'Authentication Required',
                    message: 'Please sign in to send a support ticket.'
                })
                setIsModalOpen(true)
            } else if (error.response?.status === 400) {
                setModalContent({
                    type: 'error',
                    title: 'Invalid Request',
                    message: 'Please check that all required fields are filled out correctly.'
                })
                setIsModalOpen(true)
            } else {
                setModalContent({
                    type: 'error',
                    title: 'Failed to Send Ticket',
                    message: 'An error occurred while sending your ticket. Please try again later.'
                })
                setIsModalOpen(true)
            }
            toast.error('Failed to send ticket')
        } finally {
            setIsLoading(false)
        }
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
        if (modalContent.type === 'success') {
            navigate('/')
        } else if (modalContent.type === 'error' && modalContent.title === 'Authentication Required') {
            navigate('/signin')
        }
    }

    const handleGoBack = () => {
        navigate(-1)
    }

    // Don't automatically send ticket on component mount
    useEffect(() => {
        if (!user) {
            toast.error('Please sign in to access this page')
            navigate('/signin')
            return
        }
        
        if (!docId) {
            toast.error('Document ID is missing')
            navigate('/')
            return
        }
    }, [user, docId, navigate])

    return (
        <div className="min-h-screen bg-[#121212] py-8">
            <div className="container mx-auto max-w-2xl px-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleGoBack}
                        className="flex items-center gap-2 dark:bg-black text-white"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                    {/* <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support Ticket</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Send us a message about the current document 
                        </p>
                    </div> */}
                </div>

                {/* Main Form */}
                <Card className=" bg-transparent border-0">
                    <CardHeader className="pb-6">
                        <CardTitle className="flex items-center gap-2 text-xl">
                           
                            Create Support Ticket
                        </CardTitle>
                        <CardDescription>
                            Please provide details about your issue or question. Our support team will respond as soon as possible.
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      
                                Email Address
                            </label>
                            <Input 
                                type="email" 
                                id="email" 
                                value={user?.email || ''} 
                                disabled 
                                className="bg-gray-50 dark:bg-black text-white"
                            />
                            <p className="text-xs text-gray-500">
                                We'll send updates to this email address
                            </p>
                        </div>

                        {/* Document ID Field */}
                        <div className="space-y-2">
                            <label htmlFor="docId" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                         
                                Document ID
                            </label>
                            <Input 
                                type="text" 
                                id="docId" 
                                value={docId || ''} 
                                disabled 
                                className="bg-gray-50 dark:bg-black text-white"
                            />
                            <p className="text-xs text-gray-500">
                                The document this ticket is related to
                            </p>
                        </div>

                        {/* Message Field */}
                        <div className="space-y-2">
                            <label htmlFor="message" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          
                                Message *
                            </label>
                            <Textarea 
                                id="message" 
                                value={message} 
                                onChange={(e) => setMessage(e.target.value)} 
                                placeholder="Please describe your issue or question in detail..."
                                rows={6}
                                className="resize-none dark:bg-[#1f1f1f] text-white"
                            />
                            <p className="text-xs text-gray-500">
                                {message.length}/1000 characters
                            </p>
                        </div>

                        {/* Submit Button */}
                        <Button 
                            onClick={handleSendTicket} 
                            disabled={isLoading || !message.trim()}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                            size="lg"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Sending Ticket...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Support Ticket
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Success/Error Modal */}
            <Modal isOpen={isModalOpen} onClose={handleModalClose}>
                <ModalCloseButton onClose={handleModalClose} />
                <ModalContent>
                    <ModalHeader>
                        <ModalTitle className="flex items-center gap-2">
                            {modalContent.type === 'success' ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            )}
                            {modalContent.title}
                        </ModalTitle>
                    </ModalHeader>
                    <ModalBody>
                        <p className="text-gray-600 dark:text-gray-300">
                            {modalContent.message}
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button 
                            onClick={handleModalClose}
                            className={modalContent.type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
                        >
                            {modalContent.type === 'success' ? 'Continue' : 'Try Again'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    )
}

export default SendTicket