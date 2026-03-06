import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap } from 'lucide-react';
import TypeSelectionLayout from '../components/auth/TypeSelectionLayout';
import UserTypeCard from '../components/auth/UserTypeCard';

const UserTypePage = () => {
  const navigate = useNavigate();

  const handleTypeSelect = (type) => {
    // Logic preserved: Navigate to login page with selected type
    navigate(`/login/${type}`);
  };

  return (
    <TypeSelectionLayout>
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Minimalist Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight sm:text-4xl">
            Identify Yourself
          </h2>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.15em]">
            Select your portal to continue
          </p>
        </div>

        {/* Selection Grid - Optimized for 2 items */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-6 px-4">
          <UserTypeCard
            type="student"
            title="Student"
            description="View your courses, scan attendance QR, and track your academic progress."
            icon={Users}
            onSelect={handleTypeSelect}
          />
          
          <UserTypeCard
            type="lecturer"
            title="Lecturer"
            description="Generate session QRs, manage student attendance, and export detailed reports."
            icon={GraduationCap}
            onSelect={handleTypeSelect}
          />
        </div>

        {/* Footer Note */}
        <div className="flex flex-col items-center gap-4 pt-8">
          <div className="h-[1px] w-12 bg-gray-100" />
          <div className="text-center max-w-xs">
            <p className="text-[11px] font-medium text-gray-400 leading-relaxed">
              Your role determines your dashboard permissions and available tools. 
              Please ensure you select the correct identity.
            </p>
          </div>
        </div>
      </div>
    </TypeSelectionLayout>
  );
};

export default UserTypePage;