import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientAddress, amount = 500000000 } = body // Default 0.5 GOR

    if (!recipientAddress) {
      return NextResponse.json(
        { error: 'Recipient address is required' },
        { status: 400 }
      )
    }

    // Forward to admin drop endpoint
    const dropResponse = await fetch('http://localhost:3000/api/admin/drop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipientAddress,
        amount,
      }),
    })

    const result = await dropResponse.json()

    if (!dropResponse.ok) {
      return NextResponse.json(result, { status: dropResponse.status })
    }

    return NextResponse.json({
      success: true,
      message: 'Test drop completed',
      result,
      recipient: recipientAddress,
      amount: amount / 1_000_000 // Convert to GOR
    })
  } catch (error) {
    console.error('Test drop error:', error)
    return NextResponse.json(
      { error: 'Failed to test token drop' },
      { status: 500 }
    )
  }
}
