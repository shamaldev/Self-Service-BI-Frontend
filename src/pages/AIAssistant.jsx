import { 
  ChatBubbleLeftEllipsisIcon, 
  UserCircleIcon, 
  PaperAirplaneIcon,
  SparklesIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";

function Message({ from, text, timestamp, isTyping = false }) {
  const isAI = from === "ai";
  
  return (
    <div className={`flex items-start gap-3 mb-4 ${isAI ? "justify-start" : "justify-end"}`}>
      {isAI && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <SparklesIcon className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
      
      <div className="flex flex-col max-w-md">
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
            isAI 
              ? "bg-gray-50 text-gray-800 rounded-bl-md" 
              : "bg-blue-500 text-white rounded-br-md"
          }`}
        >
          {isTyping ? (
            <div className="flex items-center gap-1">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
              </div>
              <span className="text-sm text-gray-500 ml-2">AI is thinking...</span>
            </div>
          ) : (
            text
          )}
        </div>
        {timestamp && (
          <span className="text-xs text-gray-400 mt-1 px-1">
            {timestamp}
          </span>
        )}
      </div>
      
      {!isAI && (
        <div className="flex-shrink-0">
          <UserCircleIcon className="h-8 w-8 text-blue-500" />
        </div>
      )}
    </div>
  );
}

function QuickPrompt({ text, onClick }) {
  return (
    <button
      onClick={() => onClick(text)}
      className="px-3 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 whitespace-nowrap"
    >
      {text}
    </button>
  );
}

function InsightCard({ icon: Icon, title, description, color, trend }) {
  const colorClasses = {
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
    green: "bg-green-50 border-green-200 text-green-800",
    red: "bg-red-50 border-red-200 text-red-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800"
  };

  return (
    <div className={`p-4 mb-3 rounded-xl border transition-all duration-200 hover:shadow-md ${colorClasses[color]}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-sm">{title}</span>
            {trend && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
          <p className="text-sm opacity-90">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: "Hello! I'm your AI Business Intelligence Assistant. I can help you analyze your data, track KPIs, and generate insights. What would you like to explore?",
      timestamp: "Just now"
    },
    {
      from: "user", 
      text: "What's our revenue growth compared to last quarter?",
      timestamp: "2 min ago"
    }
  ]);

  const quickPrompts = [
    "Show sales by region",
    "Customer retention rate",
    "Top performing products",
    "Monthly trends"
  ];

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    setMessages(prev => [...prev, {
      from: "user",
      text: inputValue,
      timestamp: "Now"
    }]);
    
    setInputValue("");
    setIsLoading(true);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        from: "ai",
        text: "Based on your data, revenue increased by 12% compared to last quarter. The main growth drivers were enterprise sales (+18%) and subscription renewals (+8%). Would you like me to break this down further?",
        timestamp: "Now"
      }]);
      setIsLoading(false);
    }, 2000);
  };

  const handleQuickPrompt = (prompt) => {
    setInputValue(prompt);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AI Business Intelligence</h1>
        </div>
        <p className="text-gray-600">Ask questions in natural language and get instant, actionable insights</p>
      </div>

      {/* Chat Section */}
      <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
            Conversation
          </h2>
        </div>
        
        <div className="p-6 max-h-96 overflow-y-auto space-y-1">
          {messages.map((message, index) => (
            <Message key={index} {...message} />
          ))}
          {isLoading && <Message from="ai" text="" isTyping={true} />}
        </div>
        
        {/* Quick Prompts */}
        <div className="px-6 py-3 border-t border-gray-100">
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            {quickPrompts.map((prompt, index) => (
              <QuickPrompt key={index} text={prompt} onClick={handleQuickPrompt} />
            ))}
          </div>
          
          {/* Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about your business data..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-medium"
            >
              {isLoading ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <PaperAirplaneIcon className="h-4 w-4" />
              )}
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white shadow-lg rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5" />
              Revenue Growth Analysis
            </h2>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                7D
              </button>
              <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg">
                30D
              </button>
              <button className="px-3 py-1 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                90D
              </button>
            </div>
          </div>
          <div className="h-48 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Interactive Chart Visualization</p>
              <p className="text-xs opacity-75">Revenue trends and projections</p>
            </div>
          </div>
        </div>

        {/* Insights Panel */}
        <div className="bg-white shadow-lg rounded-2xl p-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <LightBulbIcon className="h-5 w-5" />
            AI-Generated Insights
          </h2>
          
          <div className="space-y-3">
            <InsightCard
              icon={ArrowTrendingUpIcon}
              title="Revenue Growth"
              description="Strong 12% increase driven by enterprise segment expansion."
              color="green"
              trend={12}
            />
            <InsightCard
              icon={ExclamationTriangleIcon}
              title="Attention Needed"
              description="Customer acquisition cost has increased by 8% this month."
              color="yellow"
              trend={-8}
            />
            <InsightCard
              icon={SparklesIcon}
              title="Opportunity"
              description="Mobile traffic shows 25% higher conversion potential."
              color="blue"
              trend={25}
            />
          </div>
          
          <button className="w-full mt-4 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
            View All Insights
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: "$2.4M", change: "+12%" },
          { label: "Active Users", value: "18.2K", change: "+5%" },
          { label: "Conversion Rate", value: "3.8%", change: "+0.3%" },
          { label: "Avg. Order Value", value: "$127", change: "+8%" }
        ].map((stat, index) => (
          <div key={index} className="bg-white shadow-lg rounded-2xl p-4">
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
            <div className="text-xs text-green-600 font-medium">{stat.change}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
