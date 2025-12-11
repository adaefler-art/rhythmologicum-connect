import svgPaths from "./svg-tbgoaz04au";
import clsx from "clsx";
import imgImg from "figma:asset/b3b5572d150bcc33914db97b4e749d29b169652f.png";
import { imgGroup } from "./svg-v8pbt";
type FrageButtonBackgroundImageProps = {
  additionalClassNames?: string;
};

function FrageButtonBackgroundImage({ children, additionalClassNames = "" }: React.PropsWithChildren<FrageButtonBackgroundImageProps>) {
  return (
    <div className={clsx("absolute bg-white border-2 border-gray-200 border-solid h-[58.5px] left-0 rounded-[12px] w-[327px]", additionalClassNames)}>
      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[22.5px] left-[20px] top-[16px] w-[283px]" data-name="div">
        {children}
      </div>
    </div>
  );
}
type IBackgroundImage1Props = {
  additionalClassNames?: string;
};

function IBackgroundImage1({ children, additionalClassNames = "" }: React.PropsWithChildren<IBackgroundImage1Props>) {
  return (
    <div className={clsx("absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[28px] w-[18px]", additionalClassNames)}>
      <div className="absolute content-stretch flex items-center justify-center left-0 size-[18px] top-[4.25px]" data-name="svg">
        <div className="relative shrink-0 size-[18px]" data-name="Frame">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
            {children}
          </svg>
        </div>
      </div>
    </div>
  );
}
type ButtonBackgroundImageProps = {
  additionalClassNames?: string;
};

function ButtonBackgroundImage({ children, additionalClassNames = "" }: React.PropsWithChildren<ButtonBackgroundImageProps>) {
  return (
    <div className={clsx("absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[28px] w-[15.75px]", additionalClassNames)}>
      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[21px] left-0 top-[3px] w-[15.75px]" data-name="i">
        <div className="absolute content-stretch flex h-[18px] items-center justify-center left-0 top-[1.25px] w-[15.75px]" data-name="svg">
          <div className="h-[18px] relative shrink-0 w-[15.75px]" data-name="Frame">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 18">
              {children}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
type ResultDivBackgroundImage1Props = {
  additionalClassNames?: string;
};

function ResultDivBackgroundImage1({ children, additionalClassNames = "" }: React.PropsWithChildren<ResultDivBackgroundImage1Props>) {
  return (
    <div className={clsx("absolute border-0 border-gray-200 border-solid left-0 rounded-[8px] size-[32px] top-0", additionalClassNames)}>
      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] left-[9px] top-[6px] w-[14px]" data-name="i">
        <div className="absolute content-stretch flex items-center justify-center left-0 size-[14px] top-[2.75px]" data-name="svg">
          <div className="relative shrink-0 size-[14px]" data-name="Frame">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
              {children}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
type ContentLiBackgroundImageAndTextProps = {
  text: string;
  additionalClassNames?: string;
};

function ContentLiBackgroundImageAndText({ text, additionalClassNames = "" }: ContentLiBackgroundImageAndTextProps) {
  return (
    <div className={clsx("absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[54.375px] left-0 w-[327px]", additionalClassNames)}>
      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] left-0 top-[4px] w-[12.25px]" data-name="i">
        <div className="absolute content-stretch flex h-[14px] items-center justify-center left-0 top-[2.75px] w-[12.25px]" data-name="svg">
          <div className="h-[14px] relative shrink-0 w-[12.25px]" data-name="Frame">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 14">
              <g id="Frame">
                <g clipPath="url(#clip0_1_497)">
                  <path d={svgPaths.p2612a900} fill="var(--fill-0, #1D7F8C)" id="Vector" />
                </g>
              </g>
              <defs>
                <clipPath id="clip0_1_497">
                  <path d="M0 0H12.25V14H0V0Z" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>
        </div>
      </div>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[54.4px] leading-[28px] left-[24.25px] not-italic text-[16px] text-gray-700 top-0 w-[303px]">{text}</p>
    </div>
  );
}

function IBackgroundImage() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[9px] left-0 top-[8px] w-[6px]">
      <div className="absolute content-stretch flex items-center justify-center left-0 size-[6px] top-[1.75px]" data-name="svg">
        <div className="relative shrink-0 size-[6px]" data-name="Frame">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <g id="Frame">
              <g clipPath="url(#clip0_1_522)">
                <path d={svgPaths.p17a14800} fill="var(--fill-0, #1D7F8C)" id="Vector" />
              </g>
            </g>
            <defs>
              <clipPath id="clip0_1_522">
                <path d="M0 0H6V6H0V0Z" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}
type ContentLiBackgroundImageProps = {
  text: string;
  text1: string;
  additionalClassNames?: string;
};

function ContentLiBackgroundImage({ text, text1, additionalClassNames = "" }: ContentLiBackgroundImageProps) {
  return (
    <div className={clsx("absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[81.563px] left-0 w-[327px]", additionalClassNames)}>
      <IBackgroundImage />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[81.6px] leading-[28px] left-[18px] not-italic text-[0px] text-[16px] text-black text-gray-700 top-0 w-[309px]">
        <span className="font-['Inter:Medium',sans-serif] font-medium">{text}</span>
        {text1}
      </p>
    </div>
  );
}
type ButtonBackgroundImageAndTextProps = {
  text: string;
  additionalClassNames?: string;
};

function ButtonBackgroundImageAndText({ text, additionalClassNames = "" }: ButtonBackgroundImageAndTextProps) {
  return (
    <div className={clsx("absolute bg-[#1d7f8c] border-0 border-gray-200 border-solid h-[52px] rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] w-[327px]", additionalClassNames)}>
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[24px] leading-[normal] left-[163.5px] not-italic text-[16px] text-center text-white top-[16px] translate-x-[-50%] w-[327px]">{text}</p>
    </div>
  );
}

function ResultSvgBackgroundImage() {
  return (
    <div className="absolute content-stretch flex h-[240px] items-center justify-center left-0 top-0 w-[277px]">
      <div className="bg-[rgba(0,0,0,0)] h-[240px] relative shrink-0 w-[277px]" data-name="Frame">
        <div aria-hidden="true" className="absolute border-0 border-gray-200 border-solid inset-0 pointer-events-none" />
      </div>
    </div>
  );
}
type DivBackgroundImageAndText1Props = {
  text: string;
  additionalClassNames?: string;
};

function DivBackgroundImageAndText1({ text, additionalClassNames = "" }: DivBackgroundImageAndText1Props) {
  return (
    <div className={clsx("absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[45.5px] left-0 w-[277px]", additionalClassNames)}>
      <div className="absolute bg-green-500 border-0 border-gray-200 border-solid left-0 rounded-[9999px] size-[20px] top-[2px]">
        <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[15px] left-[5.63px] top-[2.5px] w-[8.75px]" data-name="i">
          <div className="absolute content-stretch flex h-[10px] items-center justify-center left-0 top-[2.25px] w-[8.75px]" data-name="svg">
            <div className="h-[10px] relative shrink-0 w-[8.75px]" data-name="Frame">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 10">
                <g id="Frame">
                  <g clipPath="url(#clip0_1_482)">
                    <path d={svgPaths.p2b2f1880} fill="var(--fill-0, white)" id="Vector" />
                  </g>
                </g>
                <defs>
                  <clipPath id="clip0_1_482">
                    <path d="M0 0H8.75V10H0V0Z" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[45.5px] leading-[23px] left-[32px] not-italic text-[14px] text-gray-700 top-0 w-[245px]">{text}</p>
    </div>
  );
}
type ResultDivBackgroundImageProps = {
  text: string;
  text1: string;
};

function ResultDivBackgroundImage({ text, text1 }: ResultDivBackgroundImageProps) {
  return (
    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[61px] leading-[20px] left-[36px] not-italic top-0 w-[241px]">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[20px] left-0 text-[14px] text-gray-900 top-0 w-[241px]">{text}</p>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[39px] left-0 text-[12px] text-gray-500 top-[22px] w-[241px]">{text1}</p>
    </div>
  );
}
type DivBackgroundImageAndTextProps = {
  text: string;
  additionalClassNames?: string;
};

function DivBackgroundImageAndText({ text, additionalClassNames = "" }: DivBackgroundImageAndTextProps) {
  return (
    <div className={clsx("absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[48.75px] left-0 w-[327px]", additionalClassNames)}>
      <div className="absolute bg-[rgba(29,127,140,0.1)] border-0 border-gray-200 border-solid left-0 rounded-[9999px] size-[24px] top-[2px]">
        <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[16px] left-[6.75px] top-[4px] w-[10.5px]" data-name="i">
          <div className="absolute content-stretch flex h-[12px] items-center justify-center left-0 top-[1.5px] w-[10.5px]" data-name="svg">
            <div className="h-[12px] relative shrink-0 w-[10.5px]" data-name="Frame">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 12">
                <g id="Frame">
                  <g clipPath="url(#clip0_1_491)">
                    <path d={svgPaths.p9ef4800} fill="var(--fill-0, #1D7F8C)" id="Vector" />
                  </g>
                </g>
                <defs>
                  <clipPath id="clip0_1_491">
                    <path d="M0 0H10.5V12H0V0Z" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[48.75px] leading-[25px] left-[36px] not-italic text-[15px] text-gray-700 top-0 w-[291px]">{text}</p>
    </div>
  );
}

export default function Group() {
  return (
    <div className="relative size-full">
      <div className="absolute bg-white left-[534px] rounded-[8px] top-[45px]" data-name="CONTENT">
        <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit]">
          <div className="bg-[#f7f9fa] h-[3500.344px] relative shrink-0 w-[375px]" data-name="body">
            <div aria-hidden="true" className="absolute border-0 border-gray-200 border-solid inset-0 pointer-events-none" />
            <div className="absolute bg-[#f7f9fa] border-0 border-gray-200 border-solid h-[3500.344px] left-0 top-0 w-[375px]" data-name="div">
              <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[3279.344px] left-0 top-[125px] w-[375px]" data-name="div">
                <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[3191.344px] left-[24px] top-[32px] w-[327px]" data-name="div">
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[136px] leading-[28px] left-0 not-italic text-[16px] text-gray-700 top-0 w-[327px]">Stress is your body's natural response to challenges and demands. While some stress can be motivating, chronic stress can impact your physical and mental health.</p>
                  <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[28px] leading-[28px] left-0 not-italic text-[18px] text-gray-900 top-[167.94px] w-[327px]">What Happens During Stress?</p>
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[136px] leading-[28px] left-0 not-italic text-[16px] text-gray-700 top-[207.94px] w-[327px]">When you encounter a stressful situation, your body releases hormones like cortisol and adrenaline. These hormones trigger your "fight or flight" response, preparing you to handle the challenge.</p>
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[163.2px] leading-[28px] left-0 not-italic text-[16px] text-gray-700 top-[359.88px] w-[327px]">This physiological response increases your heart rate, elevates blood pressure, and boosts energy supplies. While helpful in short bursts, prolonged activation of this stress response can lead to health problems.</p>
                  <div className="absolute bg-[rgba(29,127,140,0.05)] border border-[rgba(29,127,140,0.1)] border-solid h-[155.563px] left-0 rounded-[12px] top-[547px] w-[327px]" data-name="div">
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[113.563px] left-[20px] top-[20px] w-[285px]" data-name="div">
                      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[28px] left-0 top-[2px] w-[13.5px]" data-name="i">
                        <div className="absolute content-stretch flex h-[18px] items-center justify-center left-0 top-[4.25px] w-[13.5px]" data-name="svg">
                          <div className="h-[18px] relative shrink-0 w-[13.5px]" data-name="Frame">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 18">
                              <g id="Frame">
                                <path d="M13.5 18H0V0H13.5V18Z" stroke="var(--stroke-0, #E5E7EB)" />
                                <path d={svgPaths.p10e4d900} fill="var(--fill-0, #1D7F8C)" id="Vector" />
                              </g>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[113.563px] left-[25.5px] not-italic text-[14px] top-0 w-[259.5px]" data-name="div">
                        <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[20px] leading-[20px] left-0 text-gray-900 top-0 w-[260px]">Did you know?</p>
                        <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[89.6px] leading-[23px] left-0 text-gray-700 top-[24px] w-[260px]">Short-term stress can actually improve memory and immune function, but prolonged stress has the opposite effect.</p>
                      </div>
                    </div>
                  </div>
                  <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[28px] leading-[28px] left-0 not-italic text-[18px] text-gray-900 top-[734.56px] w-[327px]">Common Signs of Stress</p>
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[136px] leading-[28px] left-0 not-italic text-[16px] text-gray-700 top-[774.56px] w-[327px]">Recognizing stress symptoms early helps you take action before they become overwhelming. Everyone experiences stress differently, but common signs include:</p>
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[389.438px] left-0 top-[926.5px] w-[327px]" data-name="ul">
                    <ContentLiBackgroundImage text="Physical symptoms:" text1="headaches, muscle tension, fatigue, stomach problems, or changes in sleep patterns" additionalClassNames="top-0" />
                    <ContentLiBackgroundImage text="Emotional changes:" text1="irritability, anxiety, feeling overwhelmed, mood swings, or difficulty relaxing" additionalClassNames="top-[93.56px]" />
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[108.75px] left-0 top-[187.13px] w-[327px]" data-name="li">
                      <IBackgroundImage />
                      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[108.8px] leading-[28px] left-[18px] not-italic text-[0px] text-[16px] text-black text-gray-700 top-0 w-[309px]">
                        <span className="font-['Inter:Medium',sans-serif] font-medium">Behavioral shifts:</span> changes in appetite, procrastination, increased use of substances, or withdrawal from social activities
                      </p>
                    </div>
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[81.563px] left-0 top-[307.88px] w-[327px]" data-name="li">
                      <IBackgroundImage />
                      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[81.6px] leading-[28px] left-[18px] not-italic text-[0px] text-[16px] text-black text-gray-700 top-0 w-[313px]">
                        <span className="font-['Inter:Medium',sans-serif] font-medium">Cognitive effects:</span> difficulty concentrating, racing thoughts, constant worrying, or poor judgment
                      </p>
                    </div>
                  </div>
                  <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[28px] leading-[28px] left-0 not-italic text-[18px] text-gray-900 top-[1347.94px] w-[327px]">Building Resilience</p>
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[136px] leading-[28px] left-0 not-italic text-[16px] text-gray-700 top-[1387.94px] w-[327px]">Resilience is your ability to adapt and bounce back from stress. It's not about avoiding stress entirely, but developing healthy ways to manage it and maintain your well-being.</p>
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[190.4px] leading-[28px] left-0 not-italic text-[16px] text-gray-700 top-[1539.88px] w-[327px]">Key factors that build resilience include maintaining strong social connections, practicing self-care, staying physically active, getting adequate sleep, and developing problem-solving skills. Think of resilience as a muscle that grows stronger with practice.</p>
                  <div className="absolute bg-white border border-gray-200 border-solid h-[357.125px] left-0 rounded-[12px] top-[1754.19px] w-[327px]" data-name="div">
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[24px] left-[20px] top-[20px] w-[285px]" data-name="h3">
                      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] left-0 top-[2px] w-[15.75px]" data-name="i">
                        <div className="absolute content-stretch flex h-[14px] items-center justify-center left-0 top-[2.75px] w-[15.75px]" data-name="svg">
                          <div className="h-[14px] relative shrink-0 w-[15.75px]" data-name="Frame">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 14">
                              <g id="Frame">
                                <g clipPath="url(#clip0_1_546)">
                                  <path d={svgPaths.p15015200} fill="var(--fill-0, #1D7F8C)" id="Vector" />
                                </g>
                              </g>
                              <defs>
                                <clipPath id="clip0_1_546">
                                  <path d="M0 0H15.75V14H0V0Z" fill="white" />
                                </clipPath>
                              </defs>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[24px] leading-[normal] left-[23.75px] not-italic text-[16px] text-gray-900 top-[2px] w-[267px]">Quick Stress Relief Techniques</p>
                    </div>
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[275.125px] left-[20px] top-[60px] w-[285px]" data-name="div">
                      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[91.172px] left-0 not-italic text-[14px] top-0 w-[285px]" data-name="div">
                        <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[20px] leading-[20px] left-0 text-gray-900 top-0 w-[285px]">Deep breathing</p>
                        <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[67.2px] leading-[23px] left-0 text-gray-700 top-[24px] w-[285px]">Breathe in for 4 seconds, hold for 4 seconds, breathe out for 4 seconds. Repeat 3-5 times.</p>
                      </div>
                      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[91.172px] left-0 not-italic text-[14px] top-[103.17px] w-[285px]" data-name="div">
                        <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[20px] leading-[20px] left-0 text-gray-900 top-0 w-[285px]">Progressive muscle relaxation</p>
                        <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[67.2px] leading-[23px] left-0 text-gray-700 top-[24px] w-[290px]">Tense each muscle group for 5 seconds, then release. Start with your toes and work up to your head.</p>
                      </div>
                      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[68.781px] left-0 not-italic text-[14px] top-[206.34px] w-[285px]" data-name="div">
                        <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[20px] leading-[20px] left-0 text-gray-900 top-0 w-[285px]">Grounding exercise (5-4-3-2-1)</p>
                        <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[44.8px] leading-[23px] left-0 text-gray-700 top-[24px] w-[285px]">Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste.</p>
                      </div>
                    </div>
                  </div>
                  <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[28px] leading-[28px] left-0 not-italic text-[18px] text-gray-900 top-[2143.31px] w-[327px]">Long-Term Stress Management</p>
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[136px] leading-[28px] left-0 not-italic text-[16px] text-gray-700 top-[2183.31px] w-[327px]">While quick techniques provide immediate relief, building long-term stress management habits creates lasting change. Consider incorporating these practices into your daily routine:</p>
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[319.875px] left-0 top-[2335.25px] w-[327px]" data-name="ul">
                    <ContentLiBackgroundImageAndText text="Regular physical activity, even 20-30 minutes of walking daily" additionalClassNames="top-0" />
                    <ContentLiBackgroundImageAndText text="Consistent sleep schedule with 7-9 hours per night" additionalClassNames="top-[66.38px]" />
                    <ContentLiBackgroundImageAndText text="Mindfulness or meditation practice, starting with just 5 minutes" additionalClassNames="top-[132.75px]" />
                    <ContentLiBackgroundImageAndText text="Regular social connection with friends and family" additionalClassNames="top-[199.13px]" />
                    <ContentLiBackgroundImageAndText text="Setting boundaries and learning to say no when needed" additionalClassNames="top-[265.5px]" />
                  </div>
                  <div className="absolute bg-amber-50 border border-amber-200 border-solid h-[200.344px] left-0 rounded-[12px] top-[2679.13px] w-[327px]" data-name="div">
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[158.344px] left-[20px] top-[20px] w-[285px]" data-name="div">
                      <IBackgroundImage1 additionalClassNames="left-0 top-[2px]">
                        <g id="Frame">
                          <g clipPath="url(#clip0_1_534)">
                            <path d={svgPaths.p17d23c00} fill="var(--fill-0, #D97706)" id="Vector" />
                          </g>
                        </g>
                        <defs>
                          <clipPath id="clip0_1_534">
                            <path d="M0 0H18V18H0V0Z" fill="white" />
                          </clipPath>
                        </defs>
                      </IBackgroundImage1>
                      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[158.344px] left-[30px] not-italic text-[14px] top-0 w-[255px]" data-name="div">
                        <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[20px] leading-[20px] left-0 text-gray-900 top-0 w-[255px]">When to seek professional help</p>
                        <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[134.4px] leading-[23px] left-0 text-gray-700 top-[24px] w-[255px]">If stress is interfering with your daily life, causing physical symptoms, or leading to feelings of hopelessness, consider speaking with a mental health professional. There's no shame in asking for help.</p>
                      </div>
                    </div>
                  </div>
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[136px] leading-[28px] left-0 not-italic text-[16px] text-gray-700 top-[2903.47px] w-[327px]">Remember, managing stress is a journey, not a destination. Small, consistent changes in your daily routine can lead to significant improvements in your overall well-being.</p>
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[136px] leading-[28px] left-0 not-italic text-[16px] text-gray-700 top-[3055.41px] w-[327px]">Be patient with yourself as you develop new habits. Progress isn't always linear, and that's perfectly normal. What matters most is your commitment to taking care of your mental and physical health.</p>
                </div>
              </div>
              <div className="absolute bg-white border-[1px_0px_0px] border-gray-200 border-solid h-[85px] left-0 top-[3415px] w-[375px]" data-name="div">
                <ButtonBackgroundImageAndText text="Continue" additionalClassNames="left-[24px] top-[16px]" />
              </div>
              <div className="absolute bg-white border-[0px_0px_1px] border-gray-200 border-solid h-[125px] left-0 top-0 w-[375px]" data-name="div">
                <ButtonBackgroundImage additionalClassNames="left-[24px] top-[24px]">
                  <g id="Frame">
                    <g clipPath="url(#clip0_1_543)">
                      <path d={svgPaths.p209ef480} fill="var(--fill-0, #1D7F8C)" id="Vector" />
                    </g>
                  </g>
                  <defs>
                    <clipPath id="clip0_1_543">
                      <path d="M0 0H15.75V18H0V0Z" fill="white" />
                    </clipPath>
                  </defs>
                </ButtonBackgroundImage>
                <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[32px] left-[24px] top-[68px] w-[327px]" data-name="h1">
                  <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[32px] leading-[normal] left-0 not-italic text-[24px] text-gray-900 top-px w-[327px]">Understanding Stress</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="absolute border-2 border-[#ced4da] border-solid inset-0 pointer-events-none rounded-[8px]" />
      </div>
      <div className="absolute bg-white left-[1027px] rounded-[8px] top-[125px]" data-name="RESULT">
        <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit]">
          <div className="bg-[#f7f9fa] h-[2629.25px] relative shrink-0 w-[375px]" data-name="body">
            <div aria-hidden="true" className="absolute border-0 border-gray-200 border-solid inset-0 pointer-events-none" />
            <div className="absolute bg-[#f7f9fa] border-0 border-gray-200 border-solid h-[2629.25px] left-0 top-0 w-[375px]" data-name="div">
              <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[2400.25px] left-0 top-[101px] w-[375px]" data-name="div">
                <div className="absolute border border-[rgba(29,127,140,0.2)] border-solid h-[235px] left-[24px] rounded-[16px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-[24px] w-[327px]" data-name="div" style={{ backgroundImage: "linear-gradient(144.297deg, rgba(29, 127, 140, 0.05) 0%, rgba(29, 127, 140, 0.1) 70.711%)" }}>
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[64px] left-[24px] top-[24px] w-[277px]" data-name="div">
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[48px] left-0 not-italic top-[8px] w-[152.172px]" data-name="div">
                      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[24px] leading-[24px] left-0 text-[16px] text-gray-900 top-0 w-[153px]">Stress Score</p>
                      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[20px] leading-[20px] left-0 text-[14px] text-gray-500 top-[28px] w-[153px]">Current Stress Balance</p>
                    </div>
                    <div className="absolute bg-[#1d7f8c] border-0 border-gray-200 border-solid left-[213px] rounded-[9999px] size-[64px] top-0" data-name="div">
                      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[32px] left-[16.64px] top-[16px] w-[30.703px]" data-name="span">
                        <p className="absolute font-['Inter:Bold',sans-serif] font-bold h-[32px] leading-[normal] left-0 not-italic text-[24px] text-white top-px w-[31px]">62</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bg-[rgba(255,255,255,0.6)] border border-[rgba(29,127,140,0.1)] border-solid h-[97px] left-[24px] rounded-[12px] top-[112px] w-[277px]" data-name="div">
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] left-[16px] top-[16px] w-[243px]" data-name="p">
                      <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[20px] leading-[normal] left-0 not-italic text-[14px] text-gray-900 top-px w-[243px]">Moderate Stress Level</p>
                    </div>
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid font-['Inter:Regular',sans-serif] font-normal h-[39px] leading-[normal] left-[16px] not-italic text-[12px] text-gray-500 top-[40px] w-[243px]" data-name="p">
                      <p className="absolute h-[19.5px] left-0 top-[2px] w-[243px]">Your stress is elevated but manageable</p>
                      <p className="absolute h-[19.5px] left-0 top-[21.5px] w-[243px]">with targeted interventions</p>
                    </div>
                  </div>
                </div>
                <div className="absolute bg-white border border-gray-200 border-solid h-[351px] left-[24px] rounded-[16px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-[279px] w-[327px]" data-name="div">
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[32px] left-[24px] top-[24px] w-[277px]" data-name="div">
                    <ResultDivBackgroundImage1 additionalClassNames="bg-[rgba(29,127,140,0.1)]">
                      <g id="Frame">
                        <g clipPath="url(#clip0_1_485)">
                          <path d={svgPaths.p3317a900} fill="var(--fill-0, #1D7F8C)" id="Vector" />
                        </g>
                      </g>
                      <defs>
                        <clipPath id="clip0_1_485">
                          <path d="M0 0H14V14H0V0Z" fill="white" />
                        </clipPath>
                      </defs>
                    </ResultDivBackgroundImage1>
                    <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[24px] leading-[24px] left-[40px] not-italic text-[16px] text-gray-900 top-[4px] w-[104px]">Stress Profile</p>
                  </div>
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[249px] left-[24px] top-[76px] w-[277px]" data-name="div">
                    <div className="absolute bg-[rgba(0,0,0,0)] border-[0px_0px_1px] border-gray-200 border-solid h-[78px] left-0 top-0 w-[277px]" data-name="div">
                      <div className="absolute bg-orange-100 border-0 border-gray-200 border-solid left-0 rounded-[9999px] size-[24px] top-[2px]" data-name="div">
                        <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[16px] left-[6px] top-[4px] w-[12px]" data-name="i">
                          <div className="absolute content-stretch flex items-center justify-center left-0 size-[12px] top-[1.5px]" data-name="svg">
                            <div className="relative shrink-0 size-[12px]" data-name="Frame">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                                <g id="Frame">
                                  <g clipPath="url(#clip0_1_525)">
                                    <path d={svgPaths.p25fac072} fill="var(--fill-0, #EA580C)" id="Vector" />
                                  </g>
                                </g>
                                <defs>
                                  <clipPath id="clip0_1_525">
                                    <path d="M0 0H12V12H0V0Z" fill="white" />
                                  </clipPath>
                                </defs>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      <ResultDivBackgroundImage text="Work Pressure" text1="Primary stress source with high demands and tight deadlines" />
                    </div>
                    <div className="absolute bg-[rgba(0,0,0,0)] border-[0px_0px_1px] border-gray-200 border-solid h-[78px] left-0 top-[94px] w-[277px]" data-name="div">
                      <div className="absolute bg-blue-100 border-0 border-gray-200 border-solid left-0 rounded-[9999px] size-[24px] top-[2px]" data-name="div">
                        <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[16px] left-[7.5px] top-[4px] w-[9px]" data-name="i">
                          <div className="absolute content-stretch flex h-[12px] items-center justify-center left-0 top-[1.5px] w-[9px]" data-name="svg">
                            <div className="h-[12px] relative shrink-0 w-[9px]" data-name="Frame">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 12">
                                <g id="Frame">
                                  <g clipPath="url(#clip0_1_500)">
                                    <path d={svgPaths.p1c47e200} fill="var(--fill-0, #2563EB)" id="Vector" />
                                  </g>
                                </g>
                                <defs>
                                  <clipPath id="clip0_1_500">
                                    <path d="M0 0H9V12H0V0Z" fill="white" />
                                  </clipPath>
                                </defs>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      <ResultDivBackgroundImage text="Sleep Quality" text1="Inconsistent patterns affecting recovery and energy levels" />
                    </div>
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[61px] left-0 top-[188px] w-[277px]" data-name="div">
                      <div className="absolute bg-purple-100 border-0 border-gray-200 border-solid left-0 rounded-[9999px] size-[24px] top-[2px]" data-name="div">
                        <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[16px] left-[4.5px] top-[4px] w-[15px]" data-name="i">
                          <div className="absolute content-stretch flex h-[12px] items-center justify-center left-0 top-[1.5px] w-[15px]" data-name="svg">
                            <div className="h-[12px] relative shrink-0 w-[15px]" data-name="Frame">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 12">
                                <g id="Frame">
                                  <g clipPath="url(#clip0_1_549)">
                                    <path d={svgPaths.p234eaa80} fill="var(--fill-0, #9333EA)" id="Vector" />
                                  </g>
                                </g>
                                <defs>
                                  <clipPath id="clip0_1_549">
                                    <path d="M0 0H15V12H0V0Z" fill="white" />
                                  </clipPath>
                                </defs>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      <ResultDivBackgroundImage text="Social Support" text1="Moderate connections with room for deeper engagement" />
                    </div>
                  </div>
                </div>
                <div className="absolute bg-white border border-gray-200 border-solid h-[326px] left-[24px] rounded-[16px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-[650px] w-[327px]" data-name="div">
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[32px] left-[24px] top-[24px] w-[277px]" data-name="div">
                    <ResultDivBackgroundImage1 additionalClassNames="bg-green-100">
                      <g id="Frame">
                        <g clipPath="url(#clip0_1_488)">
                          <path d={svgPaths.p300e0900} fill="var(--fill-0, #16A34A)" id="Vector" />
                        </g>
                      </g>
                      <defs>
                        <clipPath id="clip0_1_488">
                          <path d="M0 0H14V14H0V0Z" fill="white" />
                        </clipPath>
                      </defs>
                    </ResultDivBackgroundImage1>
                    <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[24px] leading-[24px] left-[40px] not-italic text-[16px] text-gray-900 top-[4px] w-[161px]">Resilience Indicators</p>
                  </div>
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[224px] left-[24px] top-[76px] w-[277px]" data-name="div">
                    <DivBackgroundImageAndText1 text="Strong emotional awareness with active self-reflection practices" additionalClassNames="top-0" />
                    <DivBackgroundImageAndText1 text="Regular physical activity helping maintain mental clarity" additionalClassNames="top-[59.5px]" />
                    <DivBackgroundImageAndText1 text="Positive mindset and optimistic outlook toward challenges" additionalClassNames="top-[119px]" />
                    <DivBackgroundImageAndText1 text="Good problem-solving abilities under pressure situations" additionalClassNames="top-[178.5px]" />
                  </div>
                </div>
                <div className="absolute border-0 border-gray-200 border-solid h-[445.75px] left-[24px] rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] top-[996px] w-[327px]" data-name="div" style={{ backgroundImage: "linear-gradient(126.264deg, rgb(29, 127, 140) 0%, rgba(29, 127, 140, 0.8) 70.711%)" }}>
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-[24px] top-[24px] w-[279px]" data-name="div">
                    <div className="absolute bg-[rgba(255,255,255,0.2)] border-0 border-gray-200 border-solid left-0 rounded-[9999px] size-[40px] top-0" data-name="div">
                      <IBackgroundImage1 additionalClassNames="left-[11px] top-[6px]">
                        <g id="Frame">
                          <g clipPath="url(#clip0_1_494)">
                            <path d={svgPaths.p250ead00} fill="var(--fill-0, white)" id="Vector" />
                          </g>
                        </g>
                        <defs>
                          <clipPath id="clip0_1_494">
                            <path d="M0 0H18V18H0V0Z" fill="white" />
                          </clipPath>
                        </defs>
                      </IBackgroundImage1>
                    </div>
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-[52px] not-italic top-0 w-[117.641px]" data-name="div">
                      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[24px] leading-[24px] left-0 text-[16px] text-white top-0 w-[118px]">AMY Insight</p>
                      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[16px] leading-[16px] left-0 text-[12px] text-[rgba(255,255,255,0.8)] top-[24px] w-[118px]">AI-Powered Analysis</p>
                    </div>
                  </div>
                  <div className="absolute bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] border-solid h-[341.75px] left-[24px] rounded-[12px] top-[80px] w-[279px]" data-name="div">
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid font-['Inter:Regular',sans-serif] font-normal h-[113.75px] leading-[normal] left-[16px] not-italic text-[14px] text-white top-[16px] w-[245px]" data-name="p">
                      <p className="absolute h-[22.75px] left-0 top-[2px] w-[245px]">Based on your comprehensive</p>
                      <p className="absolute h-[22.75px] left-0 top-[24.75px] w-[245px]">assessment, I've identified work-life</p>
                      <p className="absolute h-[22.75px] left-0 top-[47.5px] w-[245px]">balance as your key opportunity</p>
                      <p className="absolute h-[22.75px] left-0 top-[70.25px] w-[245px]">area. Your strong resilience</p>
                      <p className="absolute h-[22.75px] left-0 top-[93px] w-[245px]">foundation is excellent news.</p>
                    </div>
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid font-['Inter:Regular',sans-serif] font-normal h-[182px] leading-[normal] left-[16px] not-italic text-[14px] text-white top-[141.75px] w-[245px]" data-name="p">
                      <p className="absolute h-[22.75px] left-0 top-[2px] w-[245px]">I recommend implementing</p>
                      <p className="absolute h-[22.75px] left-0 top-[24.75px] w-[245px]">structured time-blocking for work</p>
                      <p className="absolute h-[22.75px] left-0 top-[47.5px] w-[245px]">tasks and establishing a calming</p>
                      <p className="absolute h-[22.75px] left-0 top-[70.25px] w-[245px]">evening routine 90 minutes before</p>
                      <p className="absolute h-[22.75px] left-0 top-[93px] w-[245px]">bed. Your existing physical activity</p>
                      <p className="absolute h-[22.75px] left-0 top-[115.75px] w-[245px]">habits provide a solid foundation—</p>
                      <p className="absolute h-[22.75px] left-0 top-[138.5px] w-[245px]">consider adding 10 minutes of</p>
                      <p className="absolute h-[22.75px] left-0 top-[161.25px] w-[245px]">mindfulness practice post-workout.</p>
                    </div>
                  </div>
                </div>
                <div className="absolute bg-white border border-gray-200 border-solid h-[334px] left-[24px] rounded-[16px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-[1461.75px] w-[327px]" data-name="div">
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[24px] left-[24px] not-italic top-[24px] w-[277px]" data-name="div">
                    <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[24px] leading-[24px] left-0 text-[16px] text-gray-900 top-0 w-[185px]">Stress Level Breakdown</p>
                    <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[16px] leading-[16px] left-[212.19px] text-[12px] text-gray-500 top-[4px] w-[66px]">Last 7 days</p>
                  </div>
                  <DivBackgroundImage additionalClassNames="h-[240px] left-[24px] top-[68px]">
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-px left-0 top-0 w-[277px]" data-name="div">
                      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-px left-0 top-0 w-[277px]" data-name="div" />
                      <div className="absolute content-stretch flex h-[240px] items-center justify-center left-0 top-0 w-[277px]" data-name="svg">
                        <div className="bg-white h-[240px] relative shrink-0 w-[277px]" data-name="Frame">
                          <div className="overflow-clip relative rounded-[inherit] size-full">
                            <div className="absolute contents inset-[-4.17%_-3.61%_8.13%_7.04%]" data-name="Group">
                              <div className="absolute inset-[-4.17%_-3.61%_8.13%_7.04%]" data-name="Group">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 268 231">
                                  <g id="Group">
                                    <g id="Vector"></g>
                                    <g id="Vector_2"></g>
                                    <g id="Vector_3"></g>
                                    <g id="Vector_4"></g>
                                    <g id="Vector_5"></g>
                                    <g id="Vector_6"></g>
                                    <g id="Vector_7"></g>
                                    <g id="Vector_8"></g>
                                    <g id="Vector_9"></g>
                                    <g id="Vector_10"></g>
                                    <g id="Vector_11"></g>
                                  </g>
                                </svg>
                              </div>
                            </div>
                            <div className="absolute contents inset-[0.92%_-0.36%_10%_6.5%]" data-name="Group">
                              <div className="absolute contents inset-[0.92%_-0.36%_10%_6.5%]" data-name="Group">
                                <div className="absolute contents inset-[20%_3.61%_32.5%_14.44%]" data-name="Group">
                                  <div className="absolute inset-[20%_3.61%_32.5%_14.44%]" data-name="Group">
                                    <div className="absolute inset-[-0.44%_0]">
                                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 227 115">
                                        <g id="Group">
                                          <g id="Vector">
                                            <path d="M0 114.5H227Z" fill="var(--fill-0, black)" />
                                            <path d="M0 114.5H227" stroke="var(--stroke-0, #E5E7EB)" />
                                          </g>
                                          <g id="Vector_2">
                                            <path d="M0 76.5H227Z" fill="var(--fill-0, black)" />
                                            <path d="M0 76.5H227" stroke="var(--stroke-0, #E5E7EB)" />
                                          </g>
                                          <g id="Vector_3">
                                            <path d="M0 38.5H227Z" fill="var(--fill-0, black)" />
                                            <path d="M0 38.5H227" stroke="var(--stroke-0, #E5E7EB)" />
                                          </g>
                                          <g id="Vector_4">
                                            <path d="M0 0.5H227Z" fill="var(--fill-0, black)" />
                                            <path d="M0 0.5H227" stroke="var(--stroke-0, #E5E7EB)" />
                                          </g>
                                        </g>
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                                <div className="absolute contents inset-[4.17%_3.61%_16.67%_14.44%]" data-name="Group">
                                  <ResultBackgroundImage additionalClassNames="inset-[4.17%_3.61%_16.67%_14.44%]">
                                    <div className="absolute contents inset-[23.82%_3.61%_16.67%_14.44%]" data-name="Group">
                                      <div className="absolute contents inset-[23.82%_3.61%_16.67%_14.44%]" data-name="Group">
                                        <div className="absolute inset-[23.82%_3.61%_16.67%_14.44%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px_-47.177px] mask-size-[227px_190px]" data-name="Group" style={{ maskImage: `url('${imgGroup}')` }}>
                                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 227 143">
                                            <g id="Group">
                                              <path d={svgPaths.p1755ff00} fill="var(--fill-0, #1D7F8C)" fillOpacity="0.1" id="Vector" />
                                            </g>
                                          </svg>
                                        </div>
                                      </div>
                                      <div className="absolute inset-[23.82%_3.61%_60.05%_14.44%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px_-47.177px] mask-size-[227px_190px]" data-name="Group" style={{ maskImage: `url('${imgGroup}')` }}>
                                        <div className="absolute inset-[-3.87%_-0.35%_-3.87%_-0.22%]">
                                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 229 42">
                                            <g id="Group">
                                              <path d={svgPaths.pf138b00} id="Vector" stroke="var(--stroke-0, #1D7F8C)" strokeMiterlimit="2" strokeWidth="3" />
                                            </g>
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  </ResultBackgroundImage>
                                </div>
                                <div className="absolute contents inset-[83.75%_-0.36%_10%_9.93%]" data-name="Group">
                                  <div className="absolute contents inset-[83.75%_81.05%_10%_9.93%]" data-name="Group">
                                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal inset-[83.75%_81.05%_10%_9.93%] leading-[normal] not-italic text-[#444444] text-[12px] text-center text-nowrap whitespace-pre">Mon</p>
                                  </div>
                                  <div className="absolute contents inset-[83.75%_68.11%_10%_24.31%]" data-name="Group">
                                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal inset-[83.75%_68.11%_10%_24.31%] leading-[normal] not-italic text-[#444444] text-[12px] text-center text-nowrap whitespace-pre">Tue</p>
                                  </div>
                                  <div className="absolute contents inset-[83.75%_53.55%_10%_37.06%]" data-name="Group">
                                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal inset-[83.75%_53.55%_10%_37.06%] leading-[normal] not-italic text-[#444444] text-[12px] text-center text-nowrap whitespace-pre">Wed</p>
                                  </div>
                                  <div className="absolute contents inset-[83.75%_40.61%_10%_51.44%]" data-name="Group">
                                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal inset-[83.75%_40.61%_10%_51.44%] leading-[normal] not-italic text-[#444444] text-[12px] text-center text-nowrap whitespace-pre">Thu</p>
                                  </div>
                                  <div className="absolute contents inset-[83.75%_28.22%_10%_66.36%]" data-name="Group">
                                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal inset-[83.75%_28.22%_10%_66.36%] leading-[normal] not-italic text-[#444444] text-[12px] text-center text-nowrap whitespace-pre">Fri</p>
                                  </div>
                                  <div className="absolute contents inset-[83.75%_13.84%_10%_79.3%]" data-name="Group">
                                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal inset-[83.75%_13.84%_10%_79.3%] leading-[normal] not-italic text-[#444444] text-[12px] text-center text-nowrap whitespace-pre">Sat</p>
                                  </div>
                                  <div className="absolute contents inset-[83.75%_-0.36%_10%_92.42%]" data-name="Group">
                                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal inset-[83.75%_-0.36%_10%_92.42%] leading-[normal] not-italic text-[#444444] text-[12px] text-center text-nowrap whitespace-pre">Sun</p>
                                  </div>
                                </div>
                                <div className="absolute contents inset-[0.92%_85.92%_13.67%_6.5%]" data-name="Group">
                                  <div className="absolute contents inset-[80.08%_85.92%_13.67%_11.19%]" data-name="Group">
                                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal inset-[80.08%_85.92%_13.67%_11.19%] leading-[normal] not-italic text-[#444444] text-[12px] text-nowrap text-right whitespace-pre">0</p>
                                  </div>
                                  <div className="absolute contents inset-[64.25%_85.92%_29.5%_8.66%]" data-name="Group">
                                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal inset-[64.25%_85.92%_29.5%_8.66%] leading-[normal] not-italic text-[#444444] text-[12px] text-nowrap text-right whitespace-pre">20</p>
                                  </div>
                                  <div className="absolute contents inset-[48.42%_85.92%_45.33%_8.3%]" data-name="Group">
                                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal inset-[48.42%_85.92%_45.33%_8.3%] leading-[normal] not-italic text-[#444444] text-[12px] text-nowrap text-right whitespace-pre">40</p>
                                  </div>
                                  <div className="absolute contents inset-[32.58%_85.92%_61.17%_8.66%]" data-name="Group">
                                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal inset-[32.58%_85.92%_61.17%_8.66%] leading-[normal] not-italic text-[#444444] text-[12px] text-nowrap text-right whitespace-pre">60</p>
                                  </div>
                                  <div className="absolute contents inset-[16.75%_85.92%_77%_8.66%]" data-name="Group">
                                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal inset-[16.75%_85.92%_77%_8.66%] leading-[normal] not-italic text-[#444444] text-[12px] text-nowrap text-right whitespace-pre">80</p>
                                  </div>
                                  <div className="absolute contents inset-[0.92%_85.92%_92.83%_6.5%]" data-name="Group">
                                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal inset-[0.92%_85.92%_92.83%_6.5%] leading-[normal] not-italic text-[#444444] text-[12px] text-nowrap text-right whitespace-pre">100</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div aria-hidden="true" className="absolute border-0 border-gray-200 border-solid inset-0 pointer-events-none" />
                        </div>
                      </div>
                      <ResultSvgBackgroundImage />
                      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-px left-0 top-0 w-[277px]" data-name="div" />
                      <ResultSvgBackgroundImage />
                    </div>
                  </DivBackgroundImage>
                </div>
                <div className="absolute bg-white border border-gray-200 border-solid h-[286px] left-[24px] rounded-[16px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-[1815.75px] w-[327px]" data-name="div">
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[24px] left-[24px] top-[24px] w-[277px]" data-name="h3">
                    <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[24px] leading-[normal] left-0 not-italic text-[16px] text-gray-900 top-[2px] w-[277px]">Stress Categories</p>
                  </div>
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[192px] left-[24px] top-[68px] w-[277px]" data-name="div">
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[36px] left-0 top-0 w-[277px]" data-name="div">
                      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] leading-[20px] left-0 not-italic text-[14px] top-0 w-[277px]" data-name="div">
                        <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[20px] left-0 text-gray-700 top-0 w-[36px]">Work</p>
                        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[20px] left-[246.09px] text-gray-900 top-0 w-[31px]">78%</p>
                      </div>
                      <div className="absolute bg-gray-200 border-0 border-gray-200 border-solid h-[8px] left-0 overflow-clip rounded-[9999px] top-[28px] w-[277px]" data-name="div">
                        <div className="absolute bg-orange-500 border-0 border-gray-200 border-solid h-px left-0 rounded-[9999px] top-0 w-[216.047px]" data-name="div" />
                      </div>
                    </div>
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[36px] left-0 top-[52px] w-[277px]" data-name="div">
                      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] leading-[20px] left-0 not-italic text-[14px] top-0 w-[277px]" data-name="div">
                        <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[20px] left-0 text-gray-700 top-0 w-[38px]">Sleep</p>
                        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[20px] left-[245.41px] text-gray-900 top-0 w-[32px]">65%</p>
                      </div>
                      <div className="absolute bg-gray-200 border-0 border-gray-200 border-solid h-[8px] left-0 overflow-clip rounded-[9999px] top-[28px] w-[277px]" data-name="div">
                        <div className="absolute bg-blue-500 border-0 border-gray-200 border-solid h-px left-0 rounded-[9999px] top-0 w-[180.047px]" data-name="div" />
                      </div>
                    </div>
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[36px] left-0 top-[104px] w-[277px]" data-name="div">
                      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] leading-[20px] left-0 not-italic text-[14px] top-0 w-[277px]" data-name="div">
                        <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[20px] left-0 text-gray-700 top-0 w-[41px]">Social</p>
                        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[20px] left-[245.03px] text-gray-900 top-0 w-[32px]">45%</p>
                      </div>
                      <div className="absolute bg-gray-200 border-0 border-gray-200 border-solid h-[8px] left-0 overflow-clip rounded-[9999px] top-[28px] w-[277px]" data-name="div">
                        <div className="absolute bg-purple-500 border-0 border-gray-200 border-solid h-px left-0 rounded-[9999px] top-0 w-[124.641px]" data-name="div" />
                      </div>
                    </div>
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[36px] left-0 top-[156px] w-[277px]" data-name="div">
                      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] leading-[20px] left-0 not-italic text-[14px] top-0 w-[277px]" data-name="div">
                        <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[20px] left-0 text-gray-700 top-0 w-[44px]">Health</p>
                        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[20px] left-[245.3px] text-gray-900 top-0 w-[32px]">32%</p>
                      </div>
                      <div className="absolute bg-gray-200 border-0 border-gray-200 border-solid h-[8px] left-0 overflow-clip rounded-[9999px] top-[28px] w-[277px]" data-name="div">
                        <div className="absolute bg-green-500 border-0 border-gray-200 border-solid h-px left-0 rounded-[9999px] top-0 w-[88.625px]" data-name="div" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute bg-[rgba(29,127,140,0.05)] border border-[rgba(29,127,140,0.2)] border-solid h-[254.5px] left-[24px] rounded-[16px] top-[2121.75px] w-[327px]" data-name="div">
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[28px] left-[24px] top-[24px] w-[277px]" data-name="div">
                    <IBackgroundImage1 additionalClassNames="left-0 top-0">
                      <g id="Frame">
                        <g clipPath="url(#clip0_1_540)">
                          <path d={svgPaths.p259afb98} fill="var(--fill-0, #1D7F8C)" id="Vector" />
                        </g>
                      </g>
                      <defs>
                        <clipPath id="clip0_1_540">
                          <path d="M0 0H18V18H0V0Z" fill="white" />
                        </clipPath>
                      </defs>
                    </IBackgroundImage1>
                    <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[24px] leading-[24px] left-[26px] not-italic text-[16px] text-gray-900 top-[2px] w-[206px]">Recommended Next Steps</p>
                  </div>
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[160.5px] left-[24px] top-[68px] w-[277px]" data-name="div">
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[45.5px] left-0 top-0 w-[277px]" data-name="div">
                      <div className="absolute bg-[#1d7f8c] border-0 border-gray-200 border-solid left-0 rounded-[9999px] size-[24px] top-[2px]" data-name="div">
                        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[16px] leading-[normal] left-[9.45px] not-italic text-[12px] text-white top-[4px] w-[11px]">1</p>
                      </div>
                      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[45.5px] leading-[23px] left-[36px] not-italic text-[14px] text-gray-700 top-0 w-[241px]">Review your personalized wellness recommendations</p>
                    </div>
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[45.5px] left-0 top-[57.5px] w-[277px]" data-name="div">
                      <div className="absolute bg-[#1d7f8c] border-0 border-gray-200 border-solid left-0 rounded-[9999px] size-[24px] top-[2px]" data-name="div">
                        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[16px] leading-[normal] left-[8.25px] not-italic text-[12px] text-white top-[4px] w-[13px]">2</p>
                      </div>
                      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[45.5px] leading-[23px] left-[36px] not-italic text-[14px] text-gray-700 top-0 w-[241px]">Schedule your first check-in with your care team</p>
                    </div>
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[45.5px] left-0 top-[115px] w-[277px]" data-name="div">
                      <div className="absolute bg-[#1d7f8c] border-0 border-gray-200 border-solid left-0 rounded-[9999px] size-[24px] top-[2px]" data-name="div">
                        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[16px] leading-[normal] left-[8.17px] not-italic text-[12px] text-white top-[4px] w-[13px]">3</p>
                      </div>
                      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[45.5px] leading-[23px] left-[36px] not-italic text-[14px] text-gray-700 top-0 w-[241px]">Explore stress management techniques in our library</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute bg-white border-[0px_0px_1px] border-gray-200 border-solid h-[101px] left-0 top-0 w-[375px]" data-name="div">
                <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[28px] left-[24px] top-[24px] w-[327px]" data-name="div">
                  <ButtonBackgroundImage additionalClassNames="left-0 top-0">
                    <g id="Frame">
                      <g clipPath="url(#clip0_1_537)">
                        <path d={svgPaths.p209ef480} fill="var(--fill-0, #9CA3AF)" id="Vector" />
                      </g>
                    </g>
                    <defs>
                      <clipPath id="clip0_1_537">
                        <path d="M0 0H15.75V18H0V0Z" fill="white" />
                      </clipPath>
                    </defs>
                  </ButtonBackgroundImage>
                  <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[28px] leading-[28px] left-[27.75px] not-italic text-[20px] text-gray-900 top-0 w-[197px]">Assessment Results</p>
                </div>
                <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] left-[60px] top-[56px] w-[291px]" data-name="p">
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[20px] leading-[normal] left-0 not-italic text-[14px] text-gray-500 top-px w-[291px]">Personalized insights from AMY</p>
                </div>
              </div>
              <div className="absolute bg-white border-[1px_0px_0px] border-gray-200 border-solid h-[151px] left-0 top-[2478px] w-[375px]" data-name="div">
                <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[118px] left-[24px] top-[16px] w-[327px]" data-name="div">
                  <ButtonBackgroundImageAndText text="View Recommendations" additionalClassNames="left-0 top-0" />
                  <div className="absolute bg-[rgba(0,0,0,0)] border border-gray-200 border-solid h-[54px] left-0 rounded-[12px] top-[64px] w-[327px]" data-name="button">
                    <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[24px] leading-[normal] left-[162.5px] not-italic text-[16px] text-center text-gray-700 top-[16px] translate-x-[-50%] w-[327px]">Continue to Dashboard</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute content-stretch flex items-center justify-center left-[-10000px] size-[9000px] top-[-10000px]" data-name="svg">
              <div className="relative shrink-0 size-[9000px]" data-name="js-plotly-tester">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9000 9000">
                  <g id="js-plotly-tester">
                    <path d="M0 0H9000V9000H0V0Z" fill="var(--fill-0, black)" id="Vector" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="absolute border-2 border-[#ced4da] border-solid inset-0 pointer-events-none rounded-[8px]" />
      </div>
      <div className="absolute bg-white left-[1821px] rounded-[8px] top-[1395px]" data-name="FRAGE">
        <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit]">
          <div className="bg-[#f7f9fa] h-[800.5px] relative shrink-0 w-[375px]" data-name="body">
            <div aria-hidden="true" className="absolute border-0 border-gray-200 border-solid inset-0 pointer-events-none" />
            <div className="absolute bg-[#f7f9fa] border-0 border-gray-200 border-solid h-[800.5px] left-0 top-0 w-[375px]" data-name="div">
              <div className="absolute bg-white border-[0px_0px_1px] border-gray-200 border-solid h-[67px] left-0 top-0 w-[375px]" data-name="div">
                <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid font-['Inter:Medium',sans-serif] font-medium h-[20px] leading-[20px] left-[24px] not-italic text-[14px] text-gray-500 top-[16px] w-[327px]" data-name="div">
                  <p className="absolute h-[20px] left-0 top-0 w-[81px]">Step 3 of 10</p>
                  <p className="absolute h-[20px] left-[295.28px] top-0 w-[32px]">30%</p>
                </div>
                <div className="absolute bg-gray-200 border-0 border-gray-200 border-solid h-[6px] left-[24px] overflow-clip rounded-[9999px] top-[44px] w-[327px]" data-name="div">
                  <div className="absolute bg-[#1d7f8c] border-0 border-gray-200 border-solid h-px left-0 rounded-[9999px] top-0 w-[98.094px]" data-name="div" />
                </div>
              </div>
              <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[733.5px] left-0 overflow-clip top-[67px] w-[375px]" data-name="div">
                <div className="absolute bg-white border border-gray-200 border-solid h-[201px] left-[24px] rounded-[16px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-[32px] w-[327px]" data-name="div">
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid font-['Inter:Semi_Bold',sans-serif] font-semibold h-[99px] leading-[normal] left-[24px] not-italic text-[18px] text-gray-900 top-[24px] w-[277px]" data-name="h2">
                    <p className="absolute h-[24.75px] left-0 top-px w-[277px]">How often have you felt</p>
                    <p className="absolute h-[24.75px] left-0 top-[25.75px] w-[277px]">overwhelmed by your</p>
                    <p className="absolute h-[24.75px] left-0 top-[50.5px] w-[277px]">responsibilities in the past</p>
                    <p className="absolute h-[24.75px] left-0 top-[75.25px] w-[277px]">week?</p>
                  </div>
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid font-['Inter:Regular',sans-serif] font-normal h-[40px] leading-[normal] left-[24px] not-italic text-[14px] text-gray-500 top-[135px] w-[277px]" data-name="p">
                    <p className="absolute h-[20px] left-0 top-px w-[279px]">Select the option that best describes your</p>
                    <p className="absolute h-[20px] left-0 top-[21px] w-[277px]">experience</p>
                  </div>
                </div>
                <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[340.5px] left-[24px] top-[265px] w-[327px]" data-name="div">
                  <FrageButtonBackgroundImage additionalClassNames="top-0">
                    <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[22.5px] leading-[23px] left-0 not-italic text-[15px] text-gray-900 top-0 w-[43px]">Never</p>
                  </FrageButtonBackgroundImage>
                  <FrageButtonBackgroundImage additionalClassNames="top-[70.5px]">
                    <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[22.5px] leading-[23px] left-0 not-italic text-[15px] text-gray-900 top-0 w-[45px]">Rarely</p>
                  </FrageButtonBackgroundImage>
                  <FrageButtonBackgroundImage additionalClassNames="top-[141px]">
                    <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[22.5px] leading-[23px] left-0 not-italic text-[15px] text-gray-900 top-0 w-[81px]">Sometimes</p>
                  </FrageButtonBackgroundImage>
                  <FrageButtonBackgroundImage additionalClassNames="top-[211.5px]">
                    <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[22.5px] leading-[23px] left-0 not-italic text-[15px] text-gray-900 top-0 w-[41px]">Often</p>
                  </FrageButtonBackgroundImage>
                  <FrageButtonBackgroundImage additionalClassNames="top-[282px]">
                    <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[22.5px] leading-[23px] left-0 not-italic text-[15px] text-gray-900 top-0 w-[52px]">Always</p>
                  </FrageButtonBackgroundImage>
                </div>
              </div>
              <div className="absolute bg-white border-[1px_0px_0px] border-gray-200 border-solid h-[87px] left-0 shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1),0px_10px_15px_0px_rgba(0,0,0,0.1)] top-[725px] w-[375px]" data-name="div">
                <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[54px] left-[24px] top-[16px] w-[327px]" data-name="div">
                  <div className="absolute bg-[rgba(0,0,0,0)] border border-gray-200 border-solid h-[54px] left-0 rounded-[12px] top-0 w-[106.328px]" data-name="button">
                    <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[24px] leading-[normal] left-[52.5px] not-italic text-[16px] text-center text-gray-700 top-[16px] translate-x-[-50%] w-[107px]">Back</p>
                  </div>
                  <div className="absolute bg-[#1d7f8c] border-0 border-gray-200 border-solid h-[54px] left-[118.33px] rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-0 w-[208.672px]" data-name="button">
                    <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[24px] leading-[normal] left-[104.5px] not-italic text-[16px] text-center text-white top-[17px] translate-x-[-50%] w-[209px]">Next</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="absolute border-2 border-[#ced4da] border-solid inset-0 pointer-events-none rounded-[8px]" />
      </div>
      <div className="absolute bg-white left-0 rounded-[8px] top-0" data-name="ASSESSMENT">
        <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit]">
          <div className="bg-[#f7f9fa] h-[896.75px] relative shrink-0 w-[375px]" data-name="body">
            <div aria-hidden="true" className="absolute border-0 border-gray-200 border-solid inset-0 pointer-events-none" />
            <div className="absolute bg-[#f7f9fa] border-0 border-gray-200 border-solid h-[896.75px] left-0 top-0 w-[375px]" data-name="div">
              <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[256px] left-[24px] top-[80px] w-[327px]" data-name="div">
                <div className="absolute left-[35.5px] pointer-events-none size-[256px] top-0" data-name="img">
                  <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover size-full" src={imgImg} />
                  <div aria-hidden="true" className="absolute border-0 border-gray-200 border-solid inset-0" />
                </div>
              </div>
              <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[386.25px] left-[24px] top-[368px] w-[327px]" data-name="div">
                <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[128px] left-0 not-italic text-center top-0 w-[327px]" data-name="div">
                  <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[64px] leading-[32px] left-[163.5px] text-[24px] text-gray-900 top-0 translate-x-[-50%] w-[327px]">Stress & Resilience Assessment</p>
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[52px] leading-[26px] left-[163.5px] text-[16px] text-gray-500 top-[76px] translate-x-[-50%] w-[327px]">This assessment takes 5–10 minutes. Your data remains private.</p>
                </div>
                <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[178.25px] left-0 top-[160px] w-[327px]" data-name="div">
                  <DivBackgroundImageAndText text="Answer questions about your current stress levels and daily experiences" additionalClassNames="top-0" />
                  <DivBackgroundImageAndText text="Receive personalized insights powered by AMY, our AI health assistant" additionalClassNames="top-[64.75px]" />
                  <DivBackgroundImageAndText text="Get actionable recommendations to improve your well-being" additionalClassNames="top-[129.5px]" />
                </div>
              </div>
              <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[110.5px] left-[24px] top-[754.25px] w-[327px]" data-name="div">
                <div className="absolute bg-[#1d7f8c] border-0 border-gray-200 border-solid h-[56px] left-0 rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-0 w-[327px]" data-name="button">
                  <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[24px] leading-[normal] left-[163.5px] not-italic text-[16px] text-center text-white top-[18px] translate-x-[-50%] w-[327px]">Start Assessment</p>
                </div>
                <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[22.5px] left-0 top-[72px] w-[327px]" data-name="div">
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[22.5px] left-0 top-0 w-[327px]" data-name="div">
                    <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[22.5px] leading-[normal] left-[163.5px] not-italic text-[#1d7f8c] text-[15px] text-center top-px translate-x-[-50%] w-[327px]">Learn more</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="absolute border-2 border-[#ced4da] border-solid inset-0 pointer-events-none rounded-[8px]" />
      </div>
    </div>
  );
}