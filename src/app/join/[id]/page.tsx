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
		<div className='min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-black dark:to-gray-800'>
			<div className='max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8'>
				<div className='text-center'>
					<h1 className='text-4xl font-bold tracking-tight text-black dark:text-white sm:text-6xl'>
						Join Cloud Deck
					</h1>
					<p className='mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300'>
						{roomName ? (
							<>
								Enter your details to join{' '}
								<span className='text-[#00A550] dark:text-[#00A550] font-medium'>
									{roomName}
								</span>{' '}
								on the Cloud.
							</>
						) : (
							'Enter your details to join the room on the Cloud.'
						)}
					</p>
				</div>

				<div className='mt-16 flow-root sm:mt-24'>
					<div className='max-w-md mx-auto rounded-lg bg-white dark:bg-black shadow-lg p-8'>
						<div className='flex flex-col items-center space-y-6'>
                                                        <div className='space-y-4 w-full max-w-md'>
                                                                <label htmlFor='userName' className='sr-only'>
                                                                        Name
                                                                </label>
                                                                <input
                                                                        id='userName'
                                                                        type='text'
                                                                        placeholder='Enter your name'
                                                                        value={userName}
                                                                        onChange={(e) => setUserName(e.target.value)}
                                                                        aria-describedby={error ? 'name-error' : undefined}
                                                                        className='w-full px-4 py-2 text-black dark:text-white placeholder-gray-500 bg-white dark:bg-black border border-[#00A550] dark:border-[#00A550] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00A550] focus:border-transparent'
                                                                />
                                                                <label htmlFor='role' className='sr-only'>
                                                                        Role
                                                                </label>
                                                                <select
                                                                        id='role'
                                                                        value={role}
                                                                        onChange={(e) => setRole(e.target.value as UserRole)}
                                                                        className='w-full px-4 py-2 text-black dark:text-white bg-white dark:bg-black border border-[#00A550] dark:border-[#00A550] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00A550] focus:border-transparent'
                                                                >
                                                                        <option value='estimator'>Estimator</option>
                                                                        <option value='observer'>Observer</option>
                                                                </select>
                                                        </div>

                                                        {error && (
                                                                <div
                                                                        id='name-error'
                                                                        className='w-full max-w-md p-4 mb-4 text-[#EC1C24] bg-[#EC1C24]/10 rounded-lg dark:bg-[#EC1C24]/20 dark:text-[#EC1C24]'
                                                                >
                                                                        {error}
                                                                </div>
                                                        )}

							<button
								onClick={handleJoinRoom}
								disabled={!userName.trim()}
								className='w-full max-w-md px-4 py-3 text-sm font-semibold text-white bg-[#00A550] hover:bg-[#008040] rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
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
