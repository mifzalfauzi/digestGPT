"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Lock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CheckoutForm() {
  const [selectedPlan, setSelectedPlan] = useState({
    name: "Standard",
    price: 3.99,
    frequency: "month",
  })
  const [isBillingAddressOpen, setIsBillingAddressOpen] = useState(false)

  const total = selectedPlan.price // For this UI prototype, total is just the plan price.

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg rounded-lg border-none">
      <CardHeader className="border-b p-6">
        <CardTitle className="text-2xl font-bold text-center">Drop2Chat Checkout</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Selected Plan Display */}
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">{selectedPlan.name} Plan</h3>
            <p className="text-sm">Billed {selectedPlan.frequency}</p>
          </div>
          <div className="text-xl font-bold">${total.toFixed(2)}</div>
        </div>

        {/* Payment Form */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Payment Information</h2>
          <div className="grid gap-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              placeholder="•••• •••• •••• ••••"
              type="text"
              inputMode="numeric"
              pattern="[0-9\s]{13,19}"
              autoComplete="cc-number"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input id="expirationDate" placeholder="MM/YY" type="text" pattern="(0[1-9]|1[0-2])\/?([0-9]{2})" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input id="cvc" placeholder="•••" type="text" pattern="[0-9]{3,4}" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nameOnCard">Name on Card</Label>
            <Input id="nameOnCard" placeholder="John Doe" type="text" autoComplete="cc-name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" placeholder="you@example.com" type="email" autoComplete="email" />
          </div>
        </div>

        {/* Billing Address */}
        <Collapsible open={isBillingAddressOpen} onOpenChange={setIsBillingAddressOpen} className="space-y-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between px-0 text-base font-semibold hover:bg-transparent"
            >
              <span>Billing Address (Optional)</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isBillingAddressOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="address1">Address Line 1</Label>
              <Input id="address1" placeholder="123 Main St" type="text" autoComplete="address-line1" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address2">Address Line 2 (Optional)</Label>
              <Input id="address2" placeholder="Apt, Suite, etc." type="text" autoComplete="address-line2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Anytown" type="text" autoComplete="address-level2" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State / Province</Label>
                <Input id="state" placeholder="CA" type="text" autoComplete="address-level1" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="zip">Zip / Postal Code</Label>
                <Input id="zip" placeholder="90210" type="text" autoComplete="postal-code" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Select defaultValue="US">
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    {/* Add more countries as needed */}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 p-6 border-t">
        {/* Summary and Total */}
        <div className="flex justify-between w-full text-lg font-semibold">
          <span>Total Due Today</span>
          <span>${total.toFixed(2)}</span>
        </div>
        {/* Pay Now Button */}
        <Button className="w-full py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white">
          <Lock className="mr-2 h-5 w-5" />
          Pay Now
        </Button>
        <p className="text-xs text-gray-500 text-center">
          By clicking "Pay Now", you agree to our Terms of Service and Privacy Policy.
        </p>
      </CardFooter>
    </Card>
  )
}
