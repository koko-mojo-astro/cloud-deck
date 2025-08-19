'use client'

import { useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { UserRole } from '@/types/room'

export default function JoinRoom() {
	const params = useParams()
	const searchParams = useSearchParams()
	const router = useRouter()
	const [userName, setUserName] = useState('')
	const [role, setRole] = useState<UserRole>('estimator')
	const [error, setError] = useState('')
	const roomName = searchParams.get('roomName')
	const handleJoinRoom = () => {
		if (!userName.trim()) {
			setError('Please enter your name')
			return
		}

		router.push(
			`/room/${
				Array.isArray(params.id) ? params.id[0] : params.id
			}?name=${encodeURIComponent(userName)}&role=${role}&roomName=${roomName}`
		)
	}

	return (
                <div className='min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-black dark:to-gray-800 font-brand'>
                        <div className='max-w-4xl mx-auto px-lg py-4xl sm:px-xl lg:px-2xl'>
				<div className='text-center'>
                                        <h1 className='text-4xl font-bold tracking-tight text-text-primary sm:text-6xl'>
						Join Cloud Deck
					</h1>
                                        <p className='mt-xl text-lg leading-8 text-gray-600 dark:text-gray-300'>
                                                {roomName ? (
                                                        <>
                                                                Enter your details to join{' '}
                                                                <span className='text-brand-green font-medium'>
                                                                        {roomName}
                                                                </span>{' '}
								on the Cloud.
							</>
						) : (
							'Enter your details to join the room on the Cloud.'
						)}
					</p>
				</div>

                                <div className='mt-4xl flow-root sm:mt-6xl'>
                                        <div className='max-w-md mx-auto rounded-lg bg-background shadow-lg p-2xl'>
                                                <div className='flex flex-col items-center space-y-xl'>
                                                        <div className='space-y-lg w-full max-w-md'>
                                                                <input
									type='text'
									placeholder='Enter your name'
									value={userName}
									onChange={(e) => setUserName(e.target.value)}
                                                                        className='w-full px-lg py-sm text-text-primary placeholder-gray-500 bg-background border border-brand-green rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent'
                                                                />
                                                                <select
                                                                        value={role}
                                                                        onChange={(e) => setRole(e.target.value as UserRole)}
                                                                        className='w-full px-lg py-sm text-text-primary bg-background border border-brand-green rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent'
                                                                >
									<option value='estimator'>Estimator</option>
									<option value='observer'>Observer</option>
								</select>
							</div>

                                                        {error && (
                                                                <div className='w-full max-w-md p-lg mb-lg text-brand-red bg-brand-red/10 rounded-lg dark:bg-brand-red/20 dark:text-brand-red'>
                                                                        {error}
                                                                </div>
                                                        )}

                                                        <button
                                                                onClick={handleJoinRoom}
                                                                disabled={!userName.trim()}
                                                                className='w-full max-w-md px-lg py-md text-sm font-semibold text-white bg-brand-green hover:bg-brand-green-dark rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
                                                        >
                                                                Join Room
                                                        </button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
