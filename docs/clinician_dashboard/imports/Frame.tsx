import svgPaths from "./svg-g7cw989gdl";
import clsx from "clsx";
import imgImg from "figma:asset/ec901f1c0d6bdc3abb3b7f2578c96a444ee001e2.png";
import imgImg1 from "figma:asset/f578f9c2a181ef669150341163e63e6e9da01878.png";
import imgImg2 from "figma:asset/410c340aa057242400c608368f918307cdd72438.png";
import imgImg3 from "figma:asset/93261e682a4fc24925831eb042e025379dab45ab.png";
import imgImg4 from "figma:asset/1ecb12199697dd16c82152392c0b02a04bd85271.png";
type Td1Props = {
  additionalClassNames?: string;
};

function Td1({ children, additionalClassNames = "" }: React.PropsWithChildren<Td1Props>) {
  return (
    <div className={clsx("absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid left-0 top-[-1px] w-[274.203px]", additionalClassNames)}>
      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-[24px] top-[16.5px] w-[226.203px]" data-name="div">
        {children}
      </div>
    </div>
  );
}
type WrapperProps = {
  additionalClassNames?: string;
};

function Wrapper({ children, additionalClassNames = "" }: React.PropsWithChildren<WrapperProps>) {
  return (
    <div className={additionalClassNames}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        {children}
      </svg>
    </div>
  );
}
type BodyIProps = {
  additionalClassNames?: string;
};

function BodyI({ children, additionalClassNames = "" }: React.PropsWithChildren<BodyIProps>) {
  return (
    <div className={clsx("absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] w-[14px]", additionalClassNames)}>
      <div className="absolute content-stretch flex items-center justify-center left-0 size-[14px] top-[2.75px]" data-name="svg">
        <Wrapper additionalClassNames="relative shrink-0 size-[14px]">{children}</Wrapper>
      </div>
    </div>
  );
}
type BodyDivProps = {
  additionalClassNames?: string;
};

function BodyDiv({ children, additionalClassNames = "" }: React.PropsWithChildren<BodyDivProps>) {
  return (
    <div className={clsx("absolute border-0 border-gray-200 border-solid left-0 rounded-[8px] size-[40px] top-0", additionalClassNames)}>
      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[24px] left-[12px] top-[8px] w-[16px]" data-name="i">
        <div className="absolute content-stretch flex items-center justify-center left-0 size-[16px] top-[4px]" data-name="svg">
          <div className="relative shrink-0 size-[16px]" data-name="Frame">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
              {children}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
type BodyTdText2Props = {
  text: string;
  additionalClassNames?: string;
};

function BodyTdText2({ text, additionalClassNames = "" }: BodyTdText2Props) {
  return (
    <div className={clsx("absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid left-[675.45px] top-[-1px] w-[121.625px]", additionalClassNames)}>
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[20px] leading-[normal] left-[61px] not-italic text-[14px] text-center text-gray-900 top-[27.5px] translate-x-[-50%] w-[122px]">{text}</p>
    </div>
  );
}
type BodyDivText1Props = {
  text: string;
  additionalClassNames?: string;
};

function BodyDivText1({ text, additionalClassNames = "" }: BodyDivText1Props) {
  return (
    <div className={clsx("absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] left-0 top-[20px]", additionalClassNames)}>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[20px] leading-[normal] left-0 not-italic text-[14px] text-gray-500 top-px w-[122px]">{text}</p>
    </div>
  );
}
type BodyDivTextProps = {
  text: string;
  additionalClassNames?: string;
};

function BodyDivText({ text, additionalClassNames = "" }: BodyDivTextProps) {
  return (
    <div className={clsx("absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] left-0 top-0", additionalClassNames)}>
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[20px] leading-[normal] left-0 not-italic text-[14px] text-gray-900 top-px w-[122px]">{text}</p>
    </div>
  );
}
type TdProps = {
  additionalClassNames?: string;
};

function Td({ additionalClassNames = "" }: TdProps) {
  return (
    <div className={clsx("absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid left-[962.13px] top-[-1px] w-[155.875px]", additionalClassNames)}>
      <BodyButtonText text="View" additionalClassNames="top-[26.5px]" />
      <BodyButtonText1 text="Edit" additionalClassNames="top-[26.5px]" />
    </div>
  );
}
type BodyTdText1Props = {
  text: string;
  additionalClassNames?: string;
};

function BodyTdText1({ text, additionalClassNames = "" }: BodyTdText1Props) {
  return (
    <div className={clsx("absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid left-[797.08px] top-[-1px] w-[165.047px]", additionalClassNames)}>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[20px] leading-[normal] left-[83px] not-italic text-[14px] text-center text-gray-500 top-[27.5px] translate-x-[-50%] w-[166px]">{text}</p>
    </div>
  );
}
type BodyTdTextProps = {
  text: string;
  additionalClassNames?: string;
};

function BodyTdText({ text, additionalClassNames = "" }: BodyTdTextProps) {
  return (
    <div className={clsx("absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid left-[274.2px] top-[-1px] w-[235.734px]", additionalClassNames)}>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[20px] leading-[normal] left-[118px] not-italic text-[14px] text-center text-gray-500 top-[27.5px] translate-x-[-50%] w-[236px]">{text}</p>
    </div>
  );
}
type BodyButtonText1Props = {
  text: string;
  additionalClassNames?: string;
};

function BodyButtonText1({ text, additionalClassNames = "" }: BodyButtonText1Props) {
  return (
    <div className={clsx("absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] left-[72.36px] w-[24.969px]", additionalClassNames)}>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[20px] leading-[normal] left-[13px] not-italic text-[14px] text-center text-gray-500 top-px translate-x-[-50%] w-[26px]">{text}</p>
    </div>
  );
}
type BodyButtonTextProps = {
  text: string;
  additionalClassNames?: string;
};

function BodyButtonText({ text, additionalClassNames = "" }: BodyButtonTextProps) {
  return (
    <div className={clsx("absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] left-[24px] w-[32.422px]", additionalClassNames)}>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[20px] leading-[normal] left-[16.5px] not-italic text-[#1d7f8c] text-[14px] text-center top-px translate-x-[-50%] w-[33px]">{text}</p>
    </div>
  );
}
type BodySpanTextProps = {
  text: string;
  additionalClassNames?: string;
};

function BodySpanText({ text, additionalClassNames = "" }: BodySpanTextProps) {
  return (
    <div className={clsx("absolute bg-green-100 border-0 border-gray-200 border-solid h-[23px] left-[24px] rounded-[9999px] w-[78.641px]", additionalClassNames)}>
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[16px] leading-[normal] left-[39.5px] not-italic text-[12px] text-center text-green-800 top-[4px] translate-x-[-50%] w-[79px]">{text}</p>
    </div>
  );
}
type BodyThTextProps = {
  text: string;
  additionalClassNames?: string;
};

function BodyThText({ text, additionalClassNames = "" }: BodyThTextProps) {
  return (
    <div className={clsx("absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] top-0", additionalClassNames)}>
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[16px] leading-[normal] left-[83px] not-italic text-[12px] text-center text-gray-400 top-[12px] tracking-[0.6px] translate-x-[-50%] w-[166px]">{text}</p>
    </div>
  );
}
type BodyPTextProps = {
  text: string;
};

function BodyPText({ text }: BodyPTextProps) {
  return (
    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] left-[24px] top-[116px] w-[212px]">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[20px] leading-[normal] left-0 not-italic text-[14px] text-gray-500 top-px w-[212px]">{text}</p>
    </div>
  );
}
type BodyHTextProps = {
  text: string;
};

function BodyHText({ text }: BodyHTextProps) {
  return (
    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[32px] left-[24px] top-[80px] w-[212px]">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold h-[32px] leading-[normal] left-0 not-italic text-[24px] text-gray-900 top-px w-[212px]">{text}</p>
    </div>
  );
}

export default function Frame() {
  return (
    <div className="bg-white relative rounded-[8px] size-full" data-name="Frame">
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <div className="bg-[#f7f9fa] h-[757px] relative shrink-0 w-[1440px]" data-name="body">
          <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[757px] left-[256px] top-0 w-[1184px]" data-name="div">
            <div className="absolute bg-white border-[0px_0px_1px] border-gray-200 border-solid h-[89px] left-0 top-0 w-[1184px]" data-name="header">
              <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[56px] left-[32px] top-[16px] w-[1120px]" data-name="div">
                <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[56px] left-0 not-italic top-0 w-[333.5px]" data-name="div">
                  <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[32px] leading-[32px] left-0 text-[24px] text-gray-900 top-0 w-[334px]">Dashboard</p>
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[20px] leading-[20px] left-0 text-[14px] text-gray-500 top-[36px] w-[334px]">Overview of your patient assessments and activity</p>
                </div>
                <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[44px] left-[927.98px] top-[6px] w-[192.016px]" data-name="div">
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[44px] left-0 top-0 w-[31.75px]" data-name="button">
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[21px] left-[8px] top-[11px] w-[15.75px]" data-name="i">
                      <div className="absolute content-stretch flex h-[18px] items-center justify-center left-0 top-[1.25px] w-[15.75px]" data-name="svg">
                        <div className="h-[18px] relative shrink-0 w-[15.75px]" data-name="Frame">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 18">
                            <g id="Frame">
                              <g clipPath="url(#clip0_1_276)">
                                <path d={svgPaths.p1541a3f1} fill="var(--fill-0, #6B7280)" id="Vector" />
                              </g>
                            </g>
                            <defs>
                              <clipPath id="clip0_1_276">
                                <path d="M0 0H15.75V18H0V0Z" fill="white" />
                              </clipPath>
                            </defs>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[32px] left-[47.75px] top-[6px] w-[144.266px]" data-name="div">
                    <div className="absolute left-0 pointer-events-none rounded-[9999px] size-[32px] top-0" data-name="img">
                      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover rounded-[9999px] size-full" src={imgImg} />
                      <div aria-hidden="true" className="absolute border-0 border-gray-200 border-solid inset-0 rounded-[9999px]" />
                    </div>
                    <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[20px] leading-[20px] left-[44px] not-italic text-[14px] text-gray-900 top-[6px] w-[101px]">Dr. Sarah Chen</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[668px] left-0 top-[89px] w-[1184px]" data-name="main">
              <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[162px] left-[32px] top-[32px] w-[1120px]" data-name="div">
                <div className="absolute bg-white border border-gray-200 border-solid h-[162px] left-0 rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-0 w-[262px]" data-name="div">
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-[24px] top-[24px] w-[212px]" data-name="div">
                    <div className="absolute bg-blue-100 border-0 border-gray-200 border-solid left-0 rounded-[8px] size-[40px] top-0" data-name="div">
                      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[24px] left-[10px] top-[8px] w-[20px]" data-name="i">
                        <div className="absolute content-stretch flex h-[16px] items-center justify-center left-0 top-[4px] w-[20px]" data-name="svg">
                          <div className="h-[16px] relative shrink-0 w-[20px]" data-name="Frame">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 16">
                              <g id="Frame">
                                <g clipPath="url(#clip0_1_270)">
                                  <path d={svgPaths.p2f83cd80} fill="var(--fill-0, #2563EB)" id="Vector" />
                                </g>
                              </g>
                              <defs>
                                <clipPath id="clip0_1_270">
                                  <path d="M0 0H20V16H0V0Z" fill="white" />
                                </clipPath>
                              </defs>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bg-green-100 border-0 border-gray-200 border-solid h-[24px] left-[164.08px] rounded-[9999px] top-[8px] w-[47.922px]" data-name="span">
                      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[16px] leading-[normal] left-[24px] not-italic text-[12px] text-center text-green-600 top-[4px] translate-x-[-50%] w-[48px]">+12%</p>
                    </div>
                  </div>
                  <BodyHText text="247" />
                  <BodyPText text="Active Patients" />
                </div>
                <div className="absolute bg-white border border-gray-200 border-solid h-[162px] left-[286px] rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-0 w-[262px]" data-name="div">
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-[24px] top-[24px] w-[212px]" data-name="div">
                    <BodyDiv additionalClassNames="bg-[rgba(29,127,140,0.1)]">
                      <g id="Frame">
                        <g clipPath="url(#clip0_1_252)">
                          <path d={svgPaths.p203b4600} fill="var(--fill-0, #1D7F8C)" id="Vector" />
                        </g>
                      </g>
                      <defs>
                        <clipPath id="clip0_1_252">
                          <path d="M0 0H16V16H0V0Z" fill="white" />
                        </clipPath>
                      </defs>
                    </BodyDiv>
                    <div className="absolute bg-orange-100 border-0 border-gray-200 border-solid h-[24px] left-[139.06px] rounded-[9999px] top-[8px] w-[72.938px]" data-name="span">
                      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[16px] leading-[normal] left-[36.5px] not-italic text-[12px] text-center text-orange-600 top-[4px] translate-x-[-50%] w-[73px]">8 pending</p>
                    </div>
                  </div>
                  <BodyHText text="32" />
                  <BodyPText text="Open Funnels" />
                </div>
                <div className="absolute bg-white border border-gray-200 border-solid h-[162px] left-[572px] rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-0 w-[262px]" data-name="div">
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-[24px] top-[24px] w-[212px]" data-name="div">
                    <div className="absolute bg-purple-100 border-0 border-gray-200 border-solid left-0 rounded-[8px] size-[40px] top-0" data-name="div">
                      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[24px] left-[14px] top-[8px] w-[12px]" data-name="i">
                        <div className="absolute content-stretch flex h-[16px] items-center justify-center left-0 top-[4px] w-[12px]" data-name="svg">
                          <div className="h-[16px] relative shrink-0 w-[12px]" data-name="Frame">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 16">
                              <g id="Frame">
                                <g clipPath="url(#clip0_1_255)">
                                  <path d={svgPaths.pfef9980} fill="var(--fill-0, #9333EA)" id="Vector" />
                                </g>
                              </g>
                              <defs>
                                <clipPath id="clip0_1_255">
                                  <path d="M0 0H12V16H0V0Z" fill="white" />
                                </clipPath>
                              </defs>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bg-green-100 border-0 border-gray-200 border-solid h-[24px] left-[161.33px] rounded-[9999px] top-[8px] w-[50.672px]" data-name="span">
                      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[16px] leading-[normal] left-[25.5px] not-italic text-[12px] text-center text-green-600 top-[4px] translate-x-[-50%] w-[51px]">Today</p>
                    </div>
                  </div>
                  <BodyHText text="18" />
                  <BodyPText text="Recent Assessments" />
                </div>
                <div className="absolute bg-white border border-gray-200 border-solid h-[162px] left-[858px] rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-0 w-[262px]" data-name="div">
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-[24px] top-[24px] w-[212px]" data-name="div">
                    <BodyDiv additionalClassNames="bg-red-100">
                      <g id="Frame">
                        <g clipPath="url(#clip0_1_261)">
                          <path d={svgPaths.p1b500f00} fill="var(--fill-0, #DC2626)" id="Vector" />
                        </g>
                      </g>
                      <defs>
                        <clipPath id="clip0_1_261">
                          <path d="M0 0H16V16H0V0Z" fill="white" />
                        </clipPath>
                      </defs>
                    </BodyDiv>
                    <div className="absolute bg-red-100 border-0 border-gray-200 border-solid h-[24px] left-[157.38px] rounded-[9999px] top-[8px] w-[54.625px]" data-name="span">
                      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[16px] leading-[normal] left-[27.5px] not-italic text-[12px] text-center text-red-600 top-[4px] translate-x-[-50%] w-[55px]">Urgent</p>
                    </div>
                  </div>
                  <BodyHText text="3" />
                  <BodyPText text="Red Flags (24h)" />
                </div>
              </div>
              <div className="absolute bg-white border border-gray-200 border-solid h-[410px] left-[32px] rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-[226px] w-[1120px]" data-name="div">
                <div className="absolute bg-[rgba(0,0,0,0)] border-[0px_0px_1px] border-gray-200 border-solid h-[77px] left-0 top-0 w-[1118px]" data-name="div">
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[28px] left-[24px] top-[24px] w-[1070px]" data-name="div">
                    <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[28px] leading-[28px] left-0 not-italic text-[18px] text-gray-900 top-0 w-[183px]">Recent Assessments</p>
                    <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] left-[1018.2px] top-[4px] w-[51.797px]" data-name="button">
                      <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[20px] leading-[normal] left-[26px] not-italic text-[#1d7f8c] text-[14px] text-center top-px translate-x-[-50%] w-[52px]">View all</p>
                    </div>
                  </div>
                </div>
                <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[331px] left-0 overflow-clip top-[77px] w-[1118px]" data-name="div">
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[331px] left-0 top-0 w-[1118px]" data-name="table">
                    <div className="absolute bg-gray-50 border-0 border-gray-200 border-solid h-[40px] left-0 top-0 w-[1118px]" data-name="thead">
                      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-0 top-0 w-[1118px]" data-name="tr">
                        <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-0 top-0 w-[274.203px]" data-name="th">
                          <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[16px] leading-[normal] left-[137.5px] not-italic text-[12px] text-center text-gray-400 top-[12px] tracking-[0.6px] translate-x-[-50%] w-[275px]">Patient</p>
                        </div>
                        <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-[274.2px] top-0 w-[235.734px]" data-name="th">
                          <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[16px] leading-[normal] left-[118px] not-italic text-[12px] text-center text-gray-400 top-[12px] tracking-[0.6px] translate-x-[-50%] w-[236px]">Funnel</p>
                        </div>
                        <BodyThText text="Status" additionalClassNames="left-[509.94px] w-[165.516px]" />
                        <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-[675.45px] top-0 w-[121.625px]" data-name="th">
                          <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[16px] leading-[normal] left-[61px] not-italic text-[12px] text-center text-gray-400 top-[12px] tracking-[0.6px] translate-x-[-50%] w-[122px]">Score</p>
                        </div>
                        <BodyThText text="Updated At" additionalClassNames="left-[797.08px] w-[165.047px]" />
                        <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-[962.13px] top-0 w-[155.875px]" data-name="th">
                          <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[16px] leading-[normal] left-[78px] not-italic text-[12px] text-center text-gray-400 top-[12px] tracking-[0.6px] translate-x-[-50%] w-[156px]">Actions</p>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bg-white border-0 border-gray-200 border-solid h-[291px] left-0 top-[40px] w-[1118px]" data-name="tbody">
                      <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[72.5px] left-0 top-0 w-[1118px]" data-name="tr">
                        <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[72.5px] left-0 top-0 w-[274.203px]" data-name="td">
                          <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-[24px] top-[16px] w-[226.203px]" data-name="div">
                            <div className="absolute left-0 pointer-events-none rounded-[9999px] size-[32px] top-[4px]" data-name="img">
                              <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover rounded-[9999px] size-full" src={imgImg1} />
                              <div aria-hidden="true" className="absolute border-0 border-gray-200 border-solid inset-0 rounded-[9999px]" />
                            </div>
                            <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-[44px] top-0 w-[118.156px]" data-name="div">
                              <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] left-0 top-0 w-[118.156px]" data-name="div">
                                <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[20px] leading-[normal] left-0 not-italic text-[14px] text-gray-900 top-px w-[119px]">Emily Rodriguez</p>
                              </div>
                              <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] left-0 top-[20px] w-[118.156px]" data-name="div">
                                <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[20px] leading-[normal] left-0 not-italic text-[14px] text-gray-500 top-px w-[119px]">ID: #PT-2024-001</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[72.5px] left-[274.2px] top-0 w-[235.734px]" data-name="td">
                          <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[20px] leading-[normal] left-[118px] not-italic text-[14px] text-center text-gray-500 top-[27px] translate-x-[-50%] w-[236px]">Stress & Resilience</p>
                        </div>
                        <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[72.5px] left-[509.94px] top-0 w-[165.516px]" data-name="td">
                          <BodySpanText text="Completed" additionalClassNames="top-[26px]" />
                        </div>
                        <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[72.5px] left-[675.45px] top-0 w-[121.625px]" data-name="td">
                          <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[20px] leading-[normal] left-[61px] not-italic text-[14px] text-center text-gray-900 top-[27px] translate-x-[-50%] w-[122px]">72/100</p>
                        </div>
                        <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[72.5px] left-[797.08px] top-0 w-[165.047px]" data-name="td">
                          <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[20px] leading-[normal] left-[83px] not-italic text-[14px] text-center text-gray-500 top-[27px] translate-x-[-50%] w-[166px]">2 hours ago</p>
                        </div>
                        <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[72.5px] left-[962.13px] top-0 w-[155.875px]" data-name="td">
                          <BodyButtonText text="View" additionalClassNames="top-[26px]" />
                          <BodyButtonText1 text="Edit" additionalClassNames="top-[26px]" />
                        </div>
                      </div>
                      <div className="absolute bg-[rgba(0,0,0,0)] border-[1px_0px_0px] border-gray-200 border-solid h-[73px] left-0 top-[72.5px] w-[1118px]" data-name="tr">
                        <Td1 additionalClassNames="h-[73px]">
                          <div className="absolute left-0 pointer-events-none rounded-[9999px] size-[32px] top-[4px]" data-name="img">
                            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover rounded-[9999px] size-full" src={imgImg2} />
                            <div aria-hidden="true" className="absolute border-0 border-gray-200 border-solid inset-0 rounded-[9999px]" />
                          </div>
                          <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-[44px] top-0 w-[121px]" data-name="div">
                            <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] left-0 top-0 w-[121px]" data-name="div">
                              <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[20px] leading-[normal] left-0 not-italic text-[14px] text-gray-900 top-px w-[121px]">Michael Chen</p>
                            </div>
                            <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] left-0 top-[20px] w-[121px]" data-name="div">
                              <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[20px] leading-[normal] left-0 not-italic text-[14px] text-gray-500 top-px w-[121px]">ID: #PT-2024-002</p>
                            </div>
                          </div>
                        </Td1>
                        <BodyTdText text="Cardiac Assessment" additionalClassNames="h-[73px]" />
                        <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[73px] left-[509.94px] top-[-1px] w-[165.516px]" data-name="td">
                          <div className="absolute bg-yellow-100 border-0 border-gray-200 border-solid h-[23px] left-[24px] rounded-[9999px] top-[26.5px] w-[80.875px]" data-name="span">
                            <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[16px] leading-[normal] left-[40.5px] not-italic text-[12px] text-center text-yellow-800 top-[4px] translate-x-[-50%] w-[81px]">In Progress</p>
                          </div>
                        </div>
                        <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[73px] left-[675.45px] top-[-1px] w-[121.625px]" data-name="td">
                          <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[20px] leading-[normal] left-[61px] not-italic text-[14px] text-center text-gray-500 top-[27.5px] translate-x-[-50%] w-[122px]">-</p>
                        </div>
                        <BodyTdText1 text="5 hours ago" additionalClassNames="h-[73px]" />
                        <Td additionalClassNames="h-[73px]" />
                      </div>
                      <div className="absolute bg-[rgba(0,0,0,0)] border-[1px_0px_0px] border-gray-200 border-solid h-[73px] left-0 top-[145.5px] w-[1118px]" data-name="tr">
                        <Td1 additionalClassNames="h-[73px]">
                          <div className="absolute left-0 pointer-events-none rounded-[9999px] size-[32px] top-[4px]" data-name="img">
                            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover rounded-[9999px] size-full" src={imgImg3} />
                            <div aria-hidden="true" className="absolute border-0 border-gray-200 border-solid inset-0 rounded-[9999px]" />
                          </div>
                          <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-[44px] top-0 w-[121.109px]" data-name="div">
                            <BodyDivText text="Sarah Johnson" additionalClassNames="w-[121.109px]" />
                            <BodyDivText1 text="ID: #PT-2024-003" additionalClassNames="w-[121.109px]" />
                          </div>
                        </Td1>
                        <BodyTdText text="HRV Monitoring" additionalClassNames="h-[73px]" />
                        <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[73px] left-[509.94px] top-[-1px] w-[165.516px]" data-name="td">
                          <div className="absolute bg-red-100 border-0 border-gray-200 border-solid h-[23px] left-[24px] rounded-[9999px] top-[26.5px] w-[65.625px]" data-name="span">
                            <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[16px] leading-[normal] left-[33px] not-italic text-[12px] text-center text-red-800 top-[4px] translate-x-[-50%] w-[66px]">Red Flag</p>
                          </div>
                        </div>
                        <BodyTdText2 text="45/100" additionalClassNames="h-[73px]" />
                        <BodyTdText1 text="1 day ago" additionalClassNames="h-[73px]" />
                        <Td additionalClassNames="h-[73px]" />
                      </div>
                      <div className="absolute bg-[rgba(0,0,0,0)] border-[1px_0px_0px] border-gray-200 border-solid h-[72.5px] left-0 top-[218.5px] w-[1118px]" data-name="tr">
                        <Td1 additionalClassNames="h-[72.5px]">
                          <div className="absolute left-0 pointer-events-none rounded-[9999px] size-[32px] top-[4px]" data-name="img">
                            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover rounded-[9999px] size-full" src={imgImg4} />
                            <div aria-hidden="true" className="absolute border-0 border-gray-200 border-solid inset-0 rounded-[9999px]" />
                          </div>
                          <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-[44px] top-0 w-[121.5px]" data-name="div">
                            <BodyDivText text="David Wilson" additionalClassNames="w-[121.5px]" />
                            <BodyDivText1 text="ID: #PT-2024-004" additionalClassNames="w-[121.5px]" />
                          </div>
                        </Td1>
                        <BodyTdText text="Stress & Resilience" additionalClassNames="h-[72.5px]" />
                        <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[72.5px] left-[509.94px] top-[-1px] w-[165.516px]" data-name="td">
                          <BodySpanText text="Completed" additionalClassNames="top-[26.5px]" />
                        </div>
                        <BodyTdText2 text="89/100" additionalClassNames="h-[72.5px]" />
                        <BodyTdText1 text="2 days ago" additionalClassNames="h-[72.5px]" />
                        <Td additionalClassNames="h-[72.5px]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bg-white border-[0px_1px_0px_0px] border-gray-200 border-solid h-[368px] left-0 top-0 w-[256px]" data-name="div">
            <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[368px] left-0 top-0 w-[255px]" data-name="div">
              <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[56px] left-[24px] top-[24px] w-[207px]" data-name="div">
                <div className="absolute bg-[#1d7f8c] border-0 border-gray-200 border-solid h-[32px] left-0 rounded-[8px] top-[12px] w-[24.234px]" data-name="div">
                  <BodyI additionalClassNames="left-[5.11px] top-[6px]">
                    <g id="Frame">
                      <path d="M14 14H0V0H14V14Z" stroke="var(--stroke-0, #E5E7EB)" />
                      <path d={svgPaths.p333ea0e0} fill="var(--fill-0, white)" id="Vector" />
                    </g>
                  </BodyI>
                </div>
                <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold h-[56px] leading-[28px] left-[36.23px] not-italic text-[18px] text-gray-900 top-0 w-[171px]">Rhythmologicum Connect</p>
              </div>
              <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[232px] left-[24px] top-[112px] w-[207px]" data-name="nav">
                <div className="absolute bg-[rgba(29,127,140,0.1)] border-0 border-gray-200 border-solid h-[40px] left-0 rounded-[8px] top-0 w-[207px]" data-name="div">
                  <BodyI additionalClassNames="left-[12px] top-[10px]">
                    <g id="Frame">
                      <g clipPath="url(#clip0_1_243)">
                        <path d={svgPaths.p3317a900} fill="var(--fill-0, #1D7F8C)" id="Vector" />
                      </g>
                    </g>
                    <defs>
                      <clipPath id="clip0_1_243">
                        <path d="M0 0H14V14H0V0Z" fill="white" />
                      </clipPath>
                    </defs>
                  </BodyI>
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[24px] left-[38px] top-[8px] w-[83.453px]" data-name="span">
                    <p className="absolute font-['Inter:Medium',sans-serif] font-medium h-[24px] leading-[normal] left-0 not-italic text-[#1d7f8c] text-[16px] top-[2px] w-[84px]">Dashboard</p>
                  </div>
                </div>
                <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-0 rounded-[8px] top-[48px] w-[207px]" data-name="div">
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] left-[12px] top-[10px] w-[17.5px]" data-name="i">
                    <div className="absolute content-stretch flex h-[14px] items-center justify-center left-0 top-[2.75px] w-[17.5px]" data-name="svg">
                      <div className="h-[14px] relative shrink-0 w-[17.5px]" data-name="Frame">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 14">
                          <g id="Frame">
                            <g clipPath="url(#clip0_1_258)">
                              <path d={svgPaths.pf9e4a00} fill="var(--fill-0, #6B7280)" id="Vector" />
                            </g>
                          </g>
                          <defs>
                            <clipPath id="clip0_1_258">
                              <path d="M0 0H17.5V14H0V0Z" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[24px] leading-[24px] left-[41.5px] not-italic text-[16px] text-gray-500 top-[8px] w-[62px]">Patients</p>
                </div>
                <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-0 rounded-[8px] top-[96px] w-[207px]" data-name="div">
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] left-[12px] top-[10px] w-[14px]" data-name="i">
                    <div className="absolute content-stretch flex items-center justify-center left-0 size-[14px] top-[2.75px]" data-name="svg">
                      <div className="bg-[rgba(0,0,0,0)] relative shrink-0 size-[14px]" data-name="Frame">
                        <div className="overflow-clip relative rounded-[inherit] size-full">
                          <Wrapper additionalClassNames="absolute inset-[1.66%]">
                            <g id="Group">
                              <path d={svgPaths.pf719280} fill="var(--fill-0, #6B7280)" id="Vector" />
                              <path d={svgPaths.p289c1b00} fill="var(--fill-0, #6B7280)" id="Vector_2" />
                              <path d={svgPaths.p24799600} fill="var(--fill-0, #6B7280)" id="Vector_3" />
                              <path d={svgPaths.p39002100} fill="var(--fill-0, #6B7280)" id="Vector_4" opacity="0" />
                            </g>
                          </Wrapper>
                        </div>
                        <div aria-hidden="true" className="absolute border-0 border-gray-200 border-solid inset-0 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[24px] leading-[24px] left-[38px] not-italic text-[16px] text-gray-500 top-[8px] w-[59px]">Funnels</p>
                </div>
                <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-0 rounded-[8px] top-[144px] w-[207px]" data-name="div">
                  <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[20px] left-[12px] top-[10px] w-[12.25px]" data-name="i">
                    <div className="absolute content-stretch flex h-[14px] items-center justify-center left-0 top-[2.75px] w-[12.25px]" data-name="svg">
                      <div className="h-[14px] relative shrink-0 w-[12.25px]" data-name="Frame">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 14">
                          <g id="Frame">
                            <g clipPath="url(#clip0_1_273)">
                              <path d={svgPaths.pcc9e00} fill="var(--fill-0, #6B7280)" id="Vector" />
                            </g>
                          </g>
                          <defs>
                            <clipPath id="clip0_1_273">
                              <path d="M0 0H12.25V14H0V0Z" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[24px] leading-[24px] left-[36.25px] not-italic text-[16px] text-gray-500 top-[8px] w-[61px]">Content</p>
                </div>
                <div className="absolute bg-[rgba(0,0,0,0)] border-0 border-gray-200 border-solid h-[40px] left-0 rounded-[8px] top-[192px] w-[207px]" data-name="div">
                  <BodyI additionalClassNames="left-[12px] top-[10px]">
                    <g id="Frame">
                      <g clipPath="url(#clip0_1_249)">
                        <path d={svgPaths.p17782e00} fill="var(--fill-0, #6B7280)" id="Vector" />
                      </g>
                    </g>
                    <defs>
                      <clipPath id="clip0_1_249">
                        <path d="M0 0H14V14H0V0Z" fill="white" />
                      </clipPath>
                    </defs>
                  </BodyI>
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[24px] leading-[24px] left-[38px] not-italic text-[16px] text-gray-500 top-[8px] w-[63px]">Settings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-2 border-[#ced4da] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}