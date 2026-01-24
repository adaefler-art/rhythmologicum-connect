import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import { ProgressBar } from './components/ui/ProgressBar';
import { Radio } from './components/ui/Radio';
import { Input } from './components/ui/Input';
import { StatCard } from './components/health/StatCard';
import { AssessmentCard } from './components/health/AssessmentCard';
import { ActionCard } from './components/health/ActionCard';
import { WeeklyChart } from './components/health/WeeklyChart';
import { QuickAction } from './components/health/QuickAction';
import { AppointmentCard } from './components/health/AppointmentCard';
import { AIAssistant } from './components/health/AIAssistant';
import { HealthScore } from './components/health/HealthScore';
import { 
  Heart, Activity, TrendingUp, Zap, Battery, 
  Droplet, Moon, Sparkles, HeartPulse, Dumbbell,
  Apple, Brain, Shield, FileText, Video, Calendar,
  MessageCircle, Download, Menu, Search, Bell
} from 'lucide-react';
import { User } from './lib/types';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'components' | 'dashboard' | 'assessment'>('components');
  const [selectedEnergy, setSelectedEnergy] = useState<string>('');
  
  const mockUser: User = {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
  };
  
  const healthMetrics = [
    { id: '1', label: 'Heart Rate', value: '72', unit: 'bpm', icon: '❤️', color: 'green', trend: 'neutral' as const },
    { id: '2', label: 'Steps', value: '8,450', unit: 'steps', icon: '👟', color: 'blue', trend: 'up' as const },
    { id: '3', label: 'Calories', value: '485.5', unit: 'kcal', icon: '🔥', color: 'yellow', trend: 'up' as const },
    { id: '4', label: 'Sleep', value: '8.2', unit: 'hrs', icon: '😴', color: 'purple', trend: 'up' as const },
  ];
  
  const assessments = [
    {
      id: '1',
      title: 'How would you rate your overall energy level today?',
      description: 'This helps us understand your daily vitality and activity capacity.',
      category: 'Cardiovascular Health',
      categoryColor: 'primary',
      icon: '💙',
      iconColor: 'text-[#4a90e2]',
      iconBgColor: 'bg-[#dbeafe]',
    },
    {
      id: '2',
      title: 'Mental Wellness Check',
      description: 'Assess your current mental and emotional well-being.',
      category: 'Mental Health',
      categoryColor: 'success',
      icon: '🧠',
      iconColor: 'text-[#5cb85c]',
      iconBgColor: 'bg-[#dcfce7]',
    },
  ];
  
  const energyOptions = [
    {
      id: 'excellent',
      label: 'Excellent',
      description: 'Full of energy and vitality',
      icon: '💚',
      iconColor: 'text-[#5cb85c]',
      iconBgColor: 'bg-[#dcfce7]',
    },
    {
      id: 'good',
      label: 'Good',
      description: 'Feeling energetic most of the day',
      icon: '💙',
      iconColor: 'text-[#4a90e2]',
      iconBgColor: 'bg-[#dbeafe]',
    },
    {
      id: 'moderate',
      label: 'Moderate',
      description: 'Some energy, occasional fatigue',
      icon: '💛',
      iconColor: 'text-[#f0ad4e]',
      iconBgColor: 'bg-[#fef9c3]',
    },
    {
      id: 'low',
      label: 'Low',
      description: 'Often tired, limited energy',
      icon: '🧡',
      iconColor: 'text-[#f97316]',
      iconBgColor: 'bg-[#ffedd5]',
    },
    {
      id: 'very-low',
      label: 'Very Low',
      description: 'Constantly exhausted',
      icon: '❤️',
      iconColor: 'text-[#d9534f]',
      iconBgColor: 'bg-[#fee2e2]',
    },
  ];
  
  const actions = [
    {
      id: '1',
      title: 'Download Full Report',
      description: 'Complete diagnosis and personalized recommendations (PDF)',
      icon: 'download',
      iconColor: 'text-[#4a90e2]',
      iconBgColor: 'bg-[#dbeafe]',
      type: 'primary' as const,
      buttonText: 'Download',
      buttonColor: 'primary',
    },
    {
      id: '2',
      title: 'Start Video Consultation',
      description: 'Video call with a licensed healthcare professional',
      icon: 'video',
      iconColor: 'text-[#5cb85c]',
      iconBgColor: 'bg-[#dcfce7]',
      type: 'success' as const,
      buttonText: 'Join Now',
      buttonColor: 'success',
    },
    {
      id: '3',
      title: 'Book In-Person Visit',
      description: 'Schedule appointment at nearest clinic',
      icon: 'calendar',
      iconColor: 'text-[#a855f7]',
      iconBgColor: 'bg-[#ede9fe]',
      type: 'secondary' as const,
      buttonText: 'Book Now',
    },
  ];
  
  const weeklyData = [
    { day: 'Mon', value: 65 },
    { day: 'Tue', value: 45 },
    { day: 'Wed', value: 85 },
    { day: 'Thu', value: 55 },
    { day: 'Fri', value: 95 },
    { day: 'Sat', value: 75 },
    { day: 'Sun', value: 50 },
  ];
  
  const appointments = [
    {
      id: '1',
      title: 'Follow-up Consultation',
      subtitle: 'Dr. Martinez - Cardiology',
      date: 'Tomorrow',
      time: '2:00 PM',
      type: 'Virtual',
    },
    {
      id: '2',
      title: 'Annual Check-up',
      subtitle: 'Dr. Chen - General Practice',
      date: 'Next Week',
      time: '10:00 AM',
      type: 'In-Person',
    },
  ];
  
  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      {/* Header */}
      <Header
        title={activeView === 'components' ? 'Component Library' : activeView === 'dashboard' ? 'Dashboard' : 'Health Assessment'}
        onBack={() => setActiveView('components')}
        onMore={() => setSidebarOpen(!sidebarOpen)}
        showBackButton={activeView !== 'components'}
      />
      
      {/* Sidebar */}
      <Sidebar
        user={mockUser}
        activeItem="dashboard"
        onNavigate={(item) => console.log('Navigate to:', item)}
        onClose={() => setSidebarOpen(false)}
        isOpen={sidebarOpen}
      />
      
      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {activeView === 'components' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-[#1f2937]">
                Health App Design System
              </h1>
              <p className="text-lg text-[#6b7280] max-w-2xl mx-auto">
                A complete component library ready for GitHub implementation. 
                All components are production-ready and fully responsive.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button variant="primary" onClick={() => setActiveView('dashboard')}>
                  View Dashboard Demo
                </Button>
                <Button variant="outline" onClick={() => setActiveView('assessment')}>
                  View Assessment Demo
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => window.open('https://github.com', '_blank')}
                  icon={<FileText className="w-4 h-4" />}
                >
                  Documentation
                </Button>
              </div>
            </div>
            
            {/* Buttons Section */}
            <section>
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Buttons</h2>
              <Card padding="lg">
                <div className="space-y-4">
                  <div className="flex gap-3 flex-wrap">
                    <Button variant="primary">Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="outline">Outline Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <Button variant="success">Success Button</Button>
                    <Button variant="warning">Warning Button</Button>
                    <Button variant="danger">Danger Button</Button>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <Button variant="primary" size="sm">Small</Button>
                    <Button variant="primary" size="md">Medium</Button>
                    <Button variant="primary" size="lg">Large</Button>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <Button variant="primary" icon={<Heart className="w-4 h-4" />}>
                      With Icon Left
                    </Button>
                    <Button variant="primary" icon={<Sparkles className="w-4 h-4" />} iconPosition="right">
                      With Icon Right
                    </Button>
                    <Button variant="primary" fullWidth>Full Width Button</Button>
                  </div>
                </div>
              </Card>
            </section>
            
            {/* Badges Section */}
            <section>
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Badges</h2>
              <Card padding="lg">
                <div className="flex gap-3 flex-wrap">
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="neutral">Neutral</Badge>
                </div>
              </Card>
            </section>
            
            {/* Progress Bars Section */}
            <section>
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Progress Bars</h2>
              <Card padding="lg">
                <div className="space-y-6">
                  <ProgressBar value={30} showLabel />
                  <ProgressBar value={65} color="success" />
                  <ProgressBar value={85} color="warning" />
                  <ProgressBar value={45} color="danger" />
                </div>
              </Card>
            </section>
            
            {/* Input Fields Section */}
            <section>
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Input Fields</h2>
              <Card padding="lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                    icon={<MessageCircle className="w-4 h-4" />}
                  />
                  <Input
                    label="Search"
                    type="text"
                    placeholder="Search..."
                    icon={<Search className="w-4 h-4" />}
                  />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Enter password"
                  />
                  <Input
                    label="With Error"
                    type="text"
                    placeholder="Error state"
                    error="This field is required"
                  />
                </div>
              </Card>
            </section>
            
            {/* Health Metrics Section */}
            <section>
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Health Stat Cards</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {healthMetrics.map((metric) => (
                  <StatCard key={metric.id} metric={metric} />
                ))}
              </div>
            </section>
            
            {/* Assessment Cards Section */}
            <section>
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Assessment Cards</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {assessments.map((assessment) => (
                  <AssessmentCard key={assessment.id} assessment={assessment} />
                ))}
              </div>
            </section>
            
            {/* Action Cards Section */}
            <section>
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Action Cards</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {actions.map((action) => (
                  <ActionCard key={action.id} action={action} />
                ))}
              </div>
            </section>
            
            {/* Charts Section */}
            <section>
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Weekly Activity Chart</h2>
              <div className="max-w-2xl">
                <WeeklyChart title="Weekly Trend" data={weeklyData} color="purple" />
              </div>
            </section>
            
            {/* Quick Actions Section */}
            <section>
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickAction
                  icon={<Activity className="w-5 h-5" />}
                  title="Health Assessment"
                  subtitle="Complete your daily check-in"
                  iconBg="bg-[#dbeafe]"
                  iconColor="text-[#4a90e2]"
                  badge={<Badge variant="danger" size="sm">New</Badge>}
                />
                <QuickAction
                  icon={<Dumbbell className="w-5 h-5" />}
                  title="Fitness & Meal Plans"
                  subtitle="Personalized recommendations"
                  iconBg="bg-[#dcfce7]"
                  iconColor="text-[#5cb85c]"
                />
                <QuickAction
                  icon={<HeartPulse className="w-5 h-5" />}
                  title="Personal Insights"
                  subtitle="Track your progress"
                  iconBg="bg-[#ede9fe]"
                  iconColor="text-[#a855f7]"
                />
              </div>
            </section>
            
            {/* Appointments Section */}
            <section>
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Appointment Cards</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {appointments.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            </section>
            
            {/* AI Assistant Section */}
            <section>
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">AI Assistant</h2>
              <div className="max-w-2xl">
                <AIAssistant />
              </div>
            </section>
            
            {/* Health Score Section */}
            <section>
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Health Score Widget</h2>
              <div className="max-w-2xl">
                <HealthScore score={84} maxScore={100} label="Overall Health Score" trend="up" />
              </div>
            </section>
          </div>
        )}
        
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#1f2937]">Good morning, Sarah</h2>
                <p className="text-sm text-[#6b7280]">Here's your health overview today</p>
              </div>
              <Button variant="primary" icon={<Bell className="w-4 h-4" />}>
                Notifications
              </Button>
            </div>
            
            <AIAssistant />
            
            <HealthScore score={84} />
            
            <div>
              <h3 className="text-lg font-semibold text-[#1f2937] mb-4">Health Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {healthMetrics.map((metric) => (
                  <StatCard key={metric.id} metric={metric} />
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-[#1f2937] mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickAction
                  icon={<Activity className="w-5 h-5" />}
                  title="Health Assessment"
                  subtitle="Complete your daily check-in"
                  iconBg="bg-[#dbeafe]"
                  iconColor="text-[#4a90e2]"
                  badge={<Badge variant="danger" size="sm">2</Badge>}
                  onClick={() => setActiveView('assessment')}
                />
                <QuickAction
                  icon={<Dumbbell className="w-5 h-5" />}
                  title="Fitness & Meal Plans"
                  subtitle="Personalized recommendations"
                  iconBg="bg-[#dcfce7]"
                  iconColor="text-[#5cb85c]"
                />
                <QuickAction
                  icon={<HeartPulse className="w-5 h-5" />}
                  title="Personal Insights"
                  subtitle="Track your progress"
                  iconBg="bg-[#ede9fe]"
                  iconColor="text-[#a855f7]"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WeeklyChart title="Weekly Activity" data={weeklyData} />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#1f2937]">Upcoming</h3>
                {appointments.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeView === 'assessment' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <ProgressBar value={30} showLabel />
            
            <AssessmentCard assessment={assessments[0]} />
            
            <div className="space-y-3">
              {energyOptions.map((option) => (
                <Radio
                  key={option.id}
                  id={option.id}
                  name="energy"
                  value={option.id}
                  checked={selectedEnergy === option.id}
                  onChange={(value) => setSelectedEnergy(value)}
                  label={option.label}
                  description={option.description}
                  icon={<span className="text-2xl">{option.icon}</span>}
                  iconBg={option.iconBgColor}
                />
              ))}
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" fullWidth onClick={() => setActiveView('dashboard')}>
                Skip
              </Button>
              <Button 
                variant="primary" 
                fullWidth 
                disabled={!selectedEnergy}
                onClick={() => {
                  alert('Assessment submitted!');
                  setActiveView('dashboard');
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
