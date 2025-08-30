import { X } from "lucide-react"
import { Button } from "./button"

const Modal = ({ isOpen, onClose, children, className = "" }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className={`relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full mx-4 ${className}`}>
        {children}
      </div>
    </div>
  )
}

const ModalHeader = ({ children, className = "" }) => (
  <div className={`flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
)

const ModalTitle = ({ children, className = "" }) => (
  <h2 className={`text-xl font-semibold text-gray-900 dark:text-white ${className}`}>
    {children}
  </h2>
)

const ModalContent = ({ children, className = "" }) => (
  <div className={`${className}`}>
    {children}
  </div>
)

const ModalBody = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
)

const ModalFooter = ({ children, className = "" }) => (
  <div className={`flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
)

const ModalCloseButton = ({ onClose, className = "" }) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClose}
    className={`absolute top-4 right-4 p-2 ${className}`}
  >
    <X className="h-4 w-4" />
  </Button>
)

export { Modal, ModalHeader, ModalTitle, ModalContent, ModalBody, ModalFooter, ModalCloseButton }