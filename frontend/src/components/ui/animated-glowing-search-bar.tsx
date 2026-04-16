import React from "react";

interface AnimatedSearchBarProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  id?: string;
}

const AnimatedSearchBar: React.FC<AnimatedSearchBarProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder = "Search...",
  id,
}) => {
  return (
    <div className="relative flex items-center justify-center">
      <div id="poda" className="relative flex items-center justify-center group">

        {/* Outer glow layer 1 */}
        <div className="absolute z-[-1] overflow-hidden h-full w-full max-h-[70px] max-w-[314px] rounded-xl blur-[3px]
                        before:absolute before:content-[''] before:z-[-2] before:w-[999px] before:h-[999px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[60deg]
                        before:bg-[conic-gradient(#000,#14532d_5%,#000_38%,#000_50%,#15803d_60%,#000_87%)]
                        before:transition-all before:duration-[2000ms]
                        group-hover:before:rotate-[-120deg] group-focus-within:before:rotate-[420deg] group-focus-within:before:duration-[4000ms]" />

        {/* Outer glow layer 2 */}
        <div className="absolute z-[-1] overflow-hidden h-full w-full max-h-[65px] max-w-[312px] rounded-xl blur-[3px]
                        before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[82deg]
                        before:bg-[conic-gradient(rgba(0,0,0,0),#052e16,rgba(0,0,0,0)_10%,rgba(0,0,0,0)_50%,#166534,rgba(0,0,0,0)_60%)]
                        before:transition-all before:duration-[2000ms]
                        group-hover:before:rotate-[-98deg] group-focus-within:before:rotate-[442deg] group-focus-within:before:duration-[4000ms]" />

        {/* Inner shimmer ring */}
        <div className="absolute z-[-1] overflow-hidden h-full w-full max-h-[63px] max-w-[307px] rounded-lg blur-[2px]
                        before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[83deg]
                        before:bg-[conic-gradient(rgba(0,0,0,0)_0%,#4ade80,rgba(0,0,0,0)_8%,rgba(0,0,0,0)_50%,#86efac,rgba(0,0,0,0)_58%)] before:brightness-[0.7]
                        before:transition-all before:duration-[2000ms]
                        group-hover:before:rotate-[-97deg] group-focus-within:before:rotate-[443deg] group-focus-within:before:duration-[4000ms]" />

        {/* Solid base glow */}
        <div className="absolute z-[-1] overflow-hidden h-full w-full max-h-[59px] max-w-[303px] rounded-xl blur-[0.5px]
                        before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[70deg]
                        before:bg-[conic-gradient(#0c0c0c,#14532d_5%,#0c0c0c_14%,#0c0c0c_50%,#15803d_60%,#0c0c0c_64%)] before:brightness-[1.2]
                        before:transition-all before:duration-[2000ms]
                        group-hover:before:rotate-[-110deg] group-focus-within:before:rotate-[430deg] group-focus-within:before:duration-[4000ms]" />

        {/* Input area */}
        <div className="relative group">
          <input
            id={id}
            placeholder={placeholder}
            type="text"
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            className="bg-[#010f05] border-none w-[301px] h-[56px] rounded-lg text-white pl-[52px] pr-[18px] text-base focus:outline-none placeholder-[#6b7280]"
          />

          {/* Gradient fade mask (hides when focused) */}
          <div className="pointer-events-none w-[100px] h-[20px] absolute bg-gradient-to-r from-transparent to-black top-[18px] left-[70px] group-focus-within:hidden" />

          {/* Green accent glow blob */}
          <div className="pointer-events-none w-[30px] h-[20px] absolute bg-[#22c55e] top-[10px] left-[5px] blur-2xl opacity-60 transition-all duration-[2000ms] group-hover:opacity-0" />

          {/* Search icon */}
          <div className="absolute left-4 top-[15px]">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" viewBox="0 0 24 24" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" height="22" fill="none">
              <circle stroke="url(#sg-circle)" r="8" cy="11" cx="11" />
              <line stroke="url(#sg-line)" y2="16.65" y1="22" x2="16.65" x1="22" />
              <defs>
                <linearGradient gradientTransform="rotate(50)" id="sg-circle">
                  <stop stopColor="#86efac" offset="0%" />
                  <stop stopColor="#4ade80" offset="50%" />
                </linearGradient>
                <linearGradient id="sg-line">
                  <stop stopColor="#4ade80" offset="0%" />
                  <stop stopColor="#22c55e" offset="50%" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnimatedSearchBar;
