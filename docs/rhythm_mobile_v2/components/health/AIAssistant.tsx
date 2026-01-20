import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Bot, Sparkles } from 'lucide-react';

interface AIAssistantProps {
  onChatNow?: () => void;
}

export function AIAssistant({ onChatNow }: AIAssistantProps) {
  return (
    <Card padding="md" shadow="md" className="bg-gradient-to-r from-[#4a90e2] to-[#6c63ff]">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
          <Bot className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold text-white">AMY Assistant</h3>
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </div>
          
          <p className="text-sm text-white/90 mb-4 leading-relaxed">
            Your personalized wellness coach. I can help you track progress, answer health questions, and provide personalized recommendations.
          </p>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={onChatNow}
            className="bg-white text-[#4a90e2] hover:bg-white/90"
          >
            Chat with AMY
          </Button>
        </div>
      </div>
    </Card>
  );
}
