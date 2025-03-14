'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface FormData {
  name: string;
  phone: string;
  email: string;
  gender: 'male' | 'female';
  college: string;
  status: 'student' | 'graduate';
  nationalId: string;
}

interface Event {
  id: string;
  name: string;
  image: string | null;
  registrations: number;
  status?: string;
  companyStatus?: string;
}

export default function EventRegistrationPage() {
  const params = useParams();
  // Decode URL-encoded parameters
  const companyName = decodeURIComponent(params.company_name as string);
  const eventId = decodeURIComponent(params.event_id as string);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    gender: 'male',
    college: '',
    status: 'student',
    nationalId: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [exactEventName, setExactEventName] = useState<string | null>(null);
  const [eventDisabled, setEventDisabled] = useState(false);
  const [companyDisabled, setCompanyDisabled] = useState(false);

  useEffect(() => {
    // Fetch event details to verify it exists and get the image
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching events for company:', companyName);
        const response = await fetch(`/api/events?company=${encodeURIComponent(companyName)}`);
        
        if (!response.ok) {
          // Check if the company is disabled
          if (response.status === 403) {
            setCompanyDisabled(true);
            throw new Error('Company is disabled');
          }
          throw new Error('Failed to fetch event details');
        }
        
        const data = await response.json();
        console.log('Events received:', data.events);
        
        // Find the event that matches (case insensitive)
        const normalizedEventId = eventId.trim().toLowerCase();
        const event = data.events.find(
          (e: Event) => e.id.trim().toLowerCase() === normalizedEventId
        );
        
        if (!event) {
          console.error('Event not found:', { eventId, availableEvents: data.events.map((e: Event) => e.id) });
          throw new Error('Event not found');
        }
        
        console.log('Found matching event:', event);
        setExactEventName(event.id); // Store the exact event name from the API
        
        // Check if event is disabled
        if (event.status === 'disabled') {
          setEventDisabled(true);
        }
        
        // Check if company is disabled
        if (event.companyStatus === 'disabled') {
          setCompanyDisabled(true);
        }
        
        if (event.image) {
          setEventImage(event.image);
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
        if (!companyDisabled) {
          setError('Event not found or no longer available');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventDetails();
  }, [companyName, eventId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!exactEventName) {
      setError('Event information is missing. Please refresh the page and try again.');
      return;
    }
    
    // Check if event or company is disabled
    if (eventDisabled || companyDisabled) {
      setError('Registration is currently disabled for this event.');
      return;
    }
    
    // Validate form
    if (
      !formData.name ||
      !formData.phone ||
      !formData.email ||
      !formData.gender ||
      !formData.college ||
      !formData.status ||
      !formData.nationalId
    ) {
      setError('All fields are required');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Invalid email format');
      return;
    }
    
    // Validate phone number (simple validation)
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Invalid phone number format');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      console.log('Submitting registration with:', {
        companyName,
        eventName: exactEventName, // Use the exact event name from the API
      });
      
      const response = await fetch('/api/events/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          eventName: exactEventName, // Use the exact event name from the API
          ...formData,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register for event');
      }
      
      // Show success message
      setSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        gender: 'male',
        college: '',
        status: 'student',
        nationalId: '',
      });
    } catch (error) {
      console.error('Error registering for event:', error);
      setError(error instanceof Error ? error.message : 'Failed to register for event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error && !submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <Link href="/" className="text-blue-500 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (eventDisabled) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Registration Disabled</h2>
                <p className="text-gray-600 mb-6">
                  Registration for this event is currently disabled. Please contact the organizer for more information.
                </p>
                <Link
                  href="/"
                  className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (companyDisabled) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Company Inactive</h2>
                <p className="text-gray-600 mb-6">
                  This company&apos;s events are currently not available. Please contact the administrator for more information.
                </p>
                <Link
                  href="/"
                  className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-blue-900 py-12">
      <div className="max-w-md mx-auto bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-purple-500">
        {eventImage ? (
          <div className="w-full h-80 relative">
            <Image
              src={eventImage}
              alt={`${companyName} - ${eventId} Event`}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-50"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
              <h1 className="text-3xl font-bold text-white text-shadow mb-2 drop-shadow-lg">
                {eventId} ✨
              </h1>
              <h2 className="text-lg text-gray-200 text-shadow drop-shadow-lg">
                Hosted by {companyName} 🚀
              </h2>
            </div>
          </div>
        ) : (
          <div className="w-full h-40 bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
            <div className="text-center p-6">
              <h1 className="text-3xl font-bold text-white text-shadow mb-2">
                {eventId} ✨
              </h1>
              <h2 className="text-lg text-gray-200 text-shadow">
                Hosted by {companyName} 🚀
              </h2>
            </div>
          </div>
        )}
        
        <div className="p-8">
          {!eventImage && (
            <>
              <h1 className="text-3xl font-bold text-center mb-2 text-white">
                {eventId} ✨
              </h1>
              <h2 className="text-xl text-gray-400 text-center mb-8">
                Hosted by {companyName} 🚀
              </h2>
            </>
          )}
          
          {success ? (
            <div className="text-center">
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-6">
                <p className="font-bold">🎉 Registration Successful! 🎉</p>
                <p>Thank you for registering for this event.</p>
              </div>
              <button
                onClick={() => setSuccess(false)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-xl"
              >
                Register Another Person 👥
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
                  ❌ {error}
                </div>
              )}
              
              <div>
                <label
                  htmlFor="name"
                  className="block text-pink-400 text-sm font-bold mb-2 flex items-center"
                >
                  Name <span className="ml-1 text-pink-300">👤</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="shadow appearance-none border border-purple-500 rounded-xl w-full py-3 px-4 bg-gray-800 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                  placeholder="Your name here"
                />
              </div>
              
              <div>
                <label
                  htmlFor="phone"
                  className="block text-pink-400 text-sm font-bold mb-2 flex items-center"
                >
                  Phone Number <span className="ml-1 text-pink-300">📱</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="shadow appearance-none border border-purple-500 rounded-xl w-full py-3 px-4 bg-gray-800 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                  placeholder="Your phone number"
                />
              </div>
              
              <div>
                <label
                  htmlFor="email"
                  className="block text-pink-400 text-sm font-bold mb-2 flex items-center"
                >
                  Email <span className="ml-1 text-pink-300">📧</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="shadow appearance-none border border-purple-500 rounded-xl w-full py-3 px-4 bg-gray-800 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                  placeholder="your.email@example.com"
                />
              </div>
              
              <div className="flex justify-between space-x-4">
                <div className="w-1/2">
                  <label
                    htmlFor="status"
                    className="block text-pink-400 text-sm font-bold mb-2 flex items-center"
                  >
                    Academic Level <span className="ml-1 text-pink-300">📚</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    className="shadow appearance-none border border-purple-500 rounded-xl w-full py-3 px-4 bg-gray-800 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  >
                    <option value="student">Student 🎓</option>
                    <option value="graduate">Graduate 🧑‍🎓</option>
                  </select>
                </div>
                
                <div className="w-1/2">
                  <label
                    htmlFor="gender"
                    className="block text-pink-400 text-sm font-bold mb-2 flex items-center"
                  >
                    Gender <span className="ml-1 text-pink-300">👫</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    className="shadow appearance-none border border-purple-500 rounded-xl w-full py-3 px-4 bg-gray-800 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  >
                    <option value="male">Male 👨</option>
                    <option value="female">Female 👩</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label
                  htmlFor="college"
                  className="block text-pink-400 text-sm font-bold mb-2 flex items-center"
                >
                  College & University <span className="ml-1 text-pink-300">🏫</span>
                </label>
                <input
                  type="text"
                  id="college"
                  name="college"
                  className="shadow appearance-none border border-purple-500 rounded-xl w-full py-3 px-4 bg-gray-800 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={formData.college}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                  placeholder="Your college/university"
                />
              </div>
              
              <div>
                <label
                  htmlFor="nationalId"
                  className="block text-pink-400 text-sm font-bold mb-2 flex items-center"
                >
                  National ID <span className="ml-1 text-pink-300">🪪</span>
                </label>
                <input
                  type="text"
                  id="nationalId"
                  name="nationalId"
                  className="shadow appearance-none border border-purple-500 rounded-xl w-full py-3 px-4 bg-gray-800 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={formData.nationalId}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                  placeholder="Your national ID"
                />
              </div>
              
              <div className="pt-6">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-4 px-6 rounded-xl w-full transform transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : '✨ Submit Registration ✨'}
                </button>
              </div>
              
              <div className="text-center text-xs text-gray-400 mt-6">
                &copy; 2025 All rights reserved 💫
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 