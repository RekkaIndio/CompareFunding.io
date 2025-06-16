import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SignUpLayout from '@/components/SignUpLayout';
import { Input } from '@/components/ui/input';

const steps = [
	{ label: 'Start', path: '/support-flow' },
	{ label: 'Who are you?', path: '/support-flow/who' },
	{ label: 'Business Info', path: '/support-flow/business' },
	{ label: 'Appointment', path: '/support-flow/appointment' },
	{ label: 'Next Steps', path: '/support-flow/post-appointment' },
	{ label: 'Done', path: '/support-flow/done' },
];

const sidebarProps = {
	title: 'Support Flow',
	description:
		'Get tailored support for your business funding journey. Our team will guide you every step of the way.',
	highlight: 'Free expert consultation',
	tips: [
		'Book a call or fill out your details',
		'We match you with the right advisor',
		'Get support for any funding need',
		'No obligation, no cost',
	],
};

export default function SupportFlow() {
	const [step, setStep] = useState(0);
	const [form, setForm] = useState({
		firstName: '',
		lastName: '',
		email: '',
		mobile: '',
		role: '',
		businessName: '',
		companyNumber: '',
		website: '',
		industry: '',
		turnover: '',
		companySize: '',
		bank: '',
		appointment: '',
	});
	const navigate = useNavigate();

	const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
	const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
	const prev = () => setStep((s) => Math.max(s - 1, 0));
	const goTo = (idx) => setStep(idx);

	return (
		<SignUpLayout
			steps={steps}
			currentStep={step}
			onStepNavigation={goTo}
			onPrevious={step > 0 ? prev : undefined}
			onNext={step < steps.length - 1 ? next : undefined}
			canGoBack={step > 0}
			canGoNext={true}
			sidebarProps={sidebarProps}
			showSidebar={true}
		>
			{step === 0 && (
				<div className="space-y-6">
					<h1 className="text-2xl font-bold text-[#212936] mb-4">
						How can we help you?
					</h1>
					<div className="space-y-4">
						<button
							className="btn-primary w-full"
							onClick={() => (window.location.href = 'tel:+441234567890')}
						>
							Call now
						</button>
						<button
							className="btn-primary w-full"
							onClick={next}
						>
							Book a free consultation
						</button>
					</div>
				</div>
			)}
			{step === 1 && (
				<div className="space-y-6">
					<h2 className="text-xl font-bold text-[#212936] mb-4">
						Who are you?
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Input
							name="firstName"
							placeholder="First Name"
							value={form.firstName}
							onChange={handleChange}
						/>
						<Input
							name="lastName"
							placeholder="Last Name"
							value={form.lastName}
							onChange={handleChange}
						/>
						<Input
							name="email"
							placeholder="Email"
							value={form.email}
							onChange={handleChange}
							className="md:col-span-2"
						/>
						<Input
							name="mobile"
							placeholder="Mobile"
							value={form.mobile}
							onChange={handleChange}
							className="md:col-span-2"
						/>
						<Input
							name="role"
							placeholder="Role (e.g. Business Owner)"
							value={form.role}
							onChange={handleChange}
							className="md:col-span-2"
						/>
					</div>
					<button
						className="btn-primary mt-6 w-full"
						onClick={next}
					>
						Next
					</button>
				</div>
			)}
			{step === 2 && (
				<div className="space-y-6">
					<h2 className="text-xl font-bold text-[#212936] mb-4">
						Tell us about your business
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Input
							name="businessName"
							placeholder="Business Name"
							value={form.businessName}
							onChange={handleChange}
							className="md:col-span-2"
						/>
						<Input
							name="companyNumber"
							placeholder="Company Number"
							value={form.companyNumber}
							onChange={handleChange}
						/>
						<Input
							name="website"
							placeholder="Website"
							value={form.website}
							onChange={handleChange}
						/>
						<Input
							name="industry"
							placeholder="Industry/Sector"
							value={form.industry}
							onChange={handleChange}
						/>
						<Input
							name="turnover"
							placeholder="Forecast Turnover"
							value={form.turnover}
							onChange={handleChange}
						/>
						<Input
							name="companySize"
							placeholder="Company Size"
							value={form.companySize}
							onChange={handleChange}
						/>
						<Input
							name="bank"
							placeholder="Bank"
							value={form.bank}
							onChange={handleChange}
							className="md:col-span-2"
						/>
					</div>
					<button
						className="btn-primary mt-6 w-full"
						onClick={next}
					>
						Next
					</button>
				</div>
			)}
			{step === 3 && (
				<div className="space-y-6">
					<h2 className="text-xl font-bold text-[#212936] mb-4">
						Book your appointment
					</h2>
					<p className="mb-4 text-[#2c3c53]">
						We'll send an invite to your email after booking.
					</p>
					<Input
						name="appointment"
						placeholder="Preferred date/time"
						value={form.appointment}
						onChange={handleChange}
						className="mb-4"
					/>
					<button
						className="btn-primary w-full"
						onClick={next}
					>
						Book Appointment
					</button>
				</div>
			)}
			{step === 4 && (
				<div className="space-y-6">
					<h2 className="text-xl font-bold text-[#212936] mb-4">
						Appointment Booked!
					</h2>
					<p className="mb-6 text-[#2c3c53]">
						What would you like to do next?
					</p>
					<div className="space-y-3">
						<button
							className="btn-primary w-full"
							onClick={next}
						>
							Apply for a specific product
						</button>
						<button
							className="btn-primary w-full"
							onClick={next}
						>
							Apply for a specific use
						</button>
						<button
							className="btn-primary w-full"
							onClick={next}
						>
							Not sure
						</button>
					</div>
				</div>
			)}
			{step === 5 && (
				<div className="space-y-6 text-center">
					<h2 className="text-xl font-bold mb-4 text-[#212936]">
						Thank you!
					</h2>
					<p className="text-[#2c3c53]">
						We have received your information. Our team will be in touch soon.
					</p>
					<button
						className="btn-primary mt-6 w-full"
						onClick={() => navigate('/')}
					>
						Back to Home
					</button>
				</div>
			)}
		</SignUpLayout>
	);
}
