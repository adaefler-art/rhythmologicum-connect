import svgPaths from "./svg-lxn9ath227";
import imgProfile from "figma:asset/300be9291d887f523202051b53de90761ee64647.png";

function Svg() {
  return (
    <div className="h-[20px] relative shrink-0 w-[22.5px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.5 20">
        <g id="SVG">
          <path d={svgPaths.p177071c0} fill="var(--fill-0, #4A90E2)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg />
    </div>
  );
}

function Button() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center pl-[24.92px] pr-[24.94px] py-0 relative shrink-0" data-name="Button">
      <Container />
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#4a90e2] text-[12px] text-center w-[33.89px]">
        <p className="css-4hzbpn leading-[16px]">Home</p>
      </div>
    </div>
  );
}

function Svg1() {
  return (
    <div className="h-[20px] relative shrink-0 w-[15px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 20">
        <g id="SVG">
          <path d={svgPaths.p20ea2540} fill="var(--fill-0, #9CA3AF)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg1 />
    </div>
  );
}

function Button1() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center px-[21.56px] py-0 relative shrink-0" data-name="Button">
      <Container1 />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[12px] text-center w-[40.63px]">
        <p className="css-4hzbpn leading-[16px]">Assess</p>
      </div>
    </div>
  );
}

function Svg2() {
  return (
    <div className="h-[20px] relative shrink-0 w-[25px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.0009 20">
        <g id="SVG">
          <path d={svgPaths.p37fdf458} fill="var(--fill-0, #9CA3AF)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg2 />
    </div>
  );
}

function Button2() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center pl-[23.98px] pr-[24px] py-0 relative shrink-0" data-name="Button">
      <Container2 />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[12px] text-center w-[35.77px]">
        <p className="css-4hzbpn leading-[16px]">Dialog</p>
      </div>
    </div>
  );
}

function Svg3() {
  return (
    <div className="h-[20px] relative shrink-0 w-[17.5px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.5 20">
        <g id="SVG">
          <path d={svgPaths.p2ff2ec80} fill="var(--fill-0, #9CA3AF)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg3 />
    </div>
  );
}

function Button3() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center pl-[23.66px] pr-[23.65px] py-0 relative shrink-0" data-name="Button">
      <Container3 />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#9ca3af] text-[12px] text-center w-[36.44px]">
        <p className="css-4hzbpn leading-[16px]">Profile</p>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative">
        <Button />
        <Button1 />
        <Button2 />
        <Button3 />
      </div>
    </div>
  );
}

function Nav() {
  return (
    <div className="absolute bg-white bottom-0 content-stretch flex flex-col items-start left-0 max-w-[375px] pb-[12px] pt-[13px] px-[20px] right-0" data-name="Nav">
      <div aria-hidden="true" className="absolute border-[#e5e7eb] border-solid border-t inset-0 pointer-events-none" />
      <Container4 />
    </div>
  );
}

function Svg4() {
  return (
    <div className="h-[20px] relative shrink-0 w-[17.5px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.5 20">
        <g id="SVG">
          <path d={svgPaths.p12da6280} fill="var(--fill-0, #374151)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg4 />
    </div>
  );
}

function Button4() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[40px]" data-name="Button">
      <Container5 />
    </div>
  );
}

function Svg5() {
  return (
    <div className="h-[20px] relative shrink-0 w-[17.5px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.5 20">
        <g id="SVG">
          <path d={svgPaths.p220efd00} fill="var(--fill-0, #374151)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg5 />
    </div>
  );
}

function Button5() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[40px]" data-name="Button">
      <Container6 />
      <div className="absolute bg-[#d9534f] right-[6px] rounded-[9999px] size-[8px] top-[6px]" data-name="Background" />
    </div>
  );
}

function Profile() {
  return (
    <div className="pointer-events-none relative rounded-[9999px] shrink-0 size-[40px]" data-name="Profile">
      <div className="absolute inset-0 overflow-hidden rounded-[9999px]">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgProfile} />
      </div>
      <div aria-hidden="true" className="absolute border-2 border-[#4a90e2] border-solid inset-0 rounded-[9999px]" />
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-name="Container">
      <Button5 />
      <Profile />
    </div>
  );
}

function Header() {
  return (
    <div className="bg-white relative shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 w-full z-[2]" data-name="Header">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[20px] py-[16px] relative w-full">
          <Button4 />
          <Container7 />
        </div>
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 1">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#1f2937] text-[24px] w-[247.34px]">
        <p className="css-4hzbpn leading-[32px]">Good morning, Sarah</p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[14px] w-[179.93px]">
        <p className="css-4hzbpn leading-[20px]">How are you feeling today?</p>
      </div>
    </div>
  );
}

function Section() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start pb-[16px] pt-[24px] px-0 relative shrink-0 w-full" data-name="Section">
      <Heading />
      <Container8 />
    </div>
  );
}

function Svg6() {
  return (
    <div className="h-[20px] relative shrink-0 w-[25px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 20">
        <g id="SVG">
          <path d={svgPaths.p20ee5f80} fill="var(--fill-0, #6C63FF)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg6 />
    </div>
  );
}

function BackgroundShadow() {
  return (
    <div className="bg-white content-stretch flex items-center justify-center overflow-clip relative rounded-[9999px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] shrink-0 size-[48px]" data-name="Background+Shadow">
      <Container9 />
    </div>
  );
}

function Heading1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 2">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-[28px] justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white w-[128.56px]">
        <p className="css-4hzbpn leading-[28px]">AMY Assistant</p>
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex flex-col items-start opacity-90 relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-white w-[130.89px]">
        <p className="css-4hzbpn leading-[16px]">Your health companion</p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Heading1 />
      <Container10 />
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Container">
      <BackgroundShadow />
      <Container11 />
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[5.2px] pt-0 px-0 relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[22.75px] not-italic relative shrink-0 text-[14px] text-white w-[269.24px]">
        <p className="css-4hzbpn mb-0">Your blood pressure readings have been</p>
        <p className="css-4hzbpn mb-0">stable this week. Keep up the great work</p>
        <p className="css-4hzbpn">with your medication routine!</p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[20px] justify-center leading-[0] not-italic relative shrink-0 text-[#6c63ff] text-[14px] text-center w-[99.66px]">
        <p className="css-4hzbpn leading-[20px]">Chat with AMY</p>
      </div>
    </div>
  );
}

function Svg7() {
  return (
    <div className="h-[12px] relative shrink-0 w-[10.5px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.5 12">
        <g id="SVG">
          <path d={svgPaths.p34544ae0} fill="var(--fill-0, #6C63FF)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg7 />
    </div>
  );
}

function Button6() {
  return (
    <div className="bg-white content-stretch flex gap-[8px] items-center overflow-clip px-[20px] py-[10px] relative rounded-[12px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] shrink-0" data-name="Button">
      <Container14 />
      <Container15 />
    </div>
  );
}

function Container16() {
  return (
    <div className="content-stretch flex flex-col gap-[10.8px] items-start relative shrink-0 w-full" data-name="Container">
      <Container12 />
      <Container13 />
      <Button6 />
    </div>
  );
}

function Section1() {
  return (
    <div className="relative rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] shrink-0 w-full" data-name="Section" style={{ backgroundImage: "linear-gradient(146.255deg, rgb(108, 99, 255) 0%, rgb(74, 144, 226) 100%)" }}>
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start p-[20px] relative w-full">
          <div className="absolute bg-white opacity-10 right-[-64px] rounded-[9999px] size-[128px] top-[-64px]" data-name="Background" />
          <Container16 />
        </div>
      </div>
    </div>
  );
}

function Heading2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#1f2937] text-[18px] w-[117.26px]">
        <p className="css-4hzbpn leading-[28px]">Health Status</p>
      </div>
    </div>
  );
}

function Svg8() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="SVG">
          <path d={svgPaths.p3f092e00} fill="var(--fill-0, #5CB85C)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container17() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg8 />
    </div>
  );
}

function Background() {
  return (
    <div className="bg-[#dcfce7] content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[40px]" data-name="Background">
      <Container17 />
    </div>
  );
}

function Background1() {
  return (
    <div className="bg-[#dcfce7] content-stretch flex flex-col items-start px-[10px] py-[4px] relative rounded-[9999px] shrink-0" data-name="Background">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#5cb85c] text-[12px] w-[36.2px]">
        <p className="css-4hzbpn leading-[16px]">Stable</p>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="absolute content-stretch flex items-center justify-between left-[16px] right-[16px] top-[16px]" data-name="Container">
      <Background />
      <Background1 />
    </div>
  );
}

function Container19() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[16px] right-[16px] top-[64px]" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-[59.98px]">
        <p className="css-4hzbpn leading-[16px]">Heart Rate</p>
      </div>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="absolute h-[28px] leading-[0] left-[16px] not-italic right-[16px] top-[84px]" data-name="Paragraph">
      <div className="absolute flex flex-col font-['Inter:Bold',sans-serif] font-bold h-[28px] justify-center left-0 text-[#1f2937] text-[20px] top-[14px] translate-y-[-50%] w-[28.97px]">
        <p className="css-4hzbpn leading-[28px]">{`72 `}</p>
      </div>
      <div className="absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[20px] justify-center left-[28.97px] text-[#6b7280] text-[14px] top-[15.5px] translate-y-[-50%] w-[29.42px]">
        <p className="css-4hzbpn leading-[20px]">bpm</p>
      </div>
    </div>
  );
}

function BackgroundShadow1() {
  return (
    <div className="absolute bg-white h-[128px] left-0 right-[173.5px] rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-0" data-name="Background+Shadow">
      <Container18 />
      <Container19 />
      <Paragraph />
    </div>
  );
}

function Svg9() {
  return (
    <div className="h-[18px] relative shrink-0 w-[13.5px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.5 18">
        <g id="SVG">
          <path d={svgPaths.p16ff0f80} fill="var(--fill-0, #4A90E2)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container20() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg9 />
    </div>
  );
}

function Background2() {
  return (
    <div className="bg-[#dbeafe] content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[40px]" data-name="Background">
      <Container20 />
    </div>
  );
}

function Background3() {
  return (
    <div className="bg-[#dbeafe] content-stretch flex flex-col items-start px-[10px] py-[4px] relative rounded-[9999px] shrink-0" data-name="Background">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#4a90e2] text-[12px] w-[41.63px]">
        <p className="css-4hzbpn leading-[16px]">Normal</p>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="absolute content-stretch flex items-center justify-between left-[16px] right-[16px] top-[16px]" data-name="Container">
      <Background2 />
      <Background3 />
    </div>
  );
}

function Container22() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[16px] right-[16px] top-[64px]" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-[85.94px]">
        <p className="css-4hzbpn leading-[16px]">Blood Pressure</p>
      </div>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="absolute h-[28px] leading-[0] left-[16px] not-italic right-[16px] top-[84px]" data-name="Paragraph">
      <div className="absolute flex flex-col font-['Inter:Bold',sans-serif] font-bold h-[28px] justify-center left-0 text-[#1f2937] text-[18px] top-[13.5px] translate-y-[-50%] w-[66.34px]">
        <p className="css-4hzbpn leading-[28px]">{`120/80 `}</p>
      </div>
      <div className="absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center left-[66.34px] text-[#6b7280] text-[12px] top-[15.5px] translate-y-[-50%] w-[37.31px]">
        <p className="css-4hzbpn leading-[16px]">mmHg</p>
      </div>
    </div>
  );
}

function BackgroundShadow2() {
  return (
    <div className="absolute bg-white h-[128px] left-[173.5px] right-0 rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-0" data-name="Background+Shadow">
      <Container21 />
      <Container22 />
      <Paragraph1 />
    </div>
  );
}

function Svg10() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="SVG">
          <path d={svgPaths.p2b97c100} fill="var(--fill-0, #9333EA)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container23() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg10 />
    </div>
  );
}

function Background4() {
  return (
    <div className="bg-[#f3e8ff] content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[40px]" data-name="Background">
      <Container23 />
    </div>
  );
}

function Background5() {
  return (
    <div className="bg-[#f3e8ff] content-stretch flex flex-col items-start px-[10px] py-[4px] relative rounded-[9999px] shrink-0" data-name="Background">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#9333ea] text-[12px] w-[48.75px]">
        <p className="css-4hzbpn leading-[16px]">On track</p>
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="absolute content-stretch flex items-center justify-between left-[16px] right-[16px] top-[16px]" data-name="Container">
      <Background4 />
      <Background5 />
    </div>
  );
}

function Container25() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[16px] right-[16px] top-[64px]" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-[39.5px]">
        <p className="css-4hzbpn leading-[16px]">Weight</p>
      </div>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="absolute h-[28px] leading-[0] left-[16px] not-italic right-[16px] top-[84px]" data-name="Paragraph">
      <div className="absolute flex flex-col font-['Inter:Bold',sans-serif] font-bold h-[28px] justify-center left-0 text-[#1f2937] text-[20px] top-[14px] translate-y-[-50%] w-[49.33px]">
        <p className="css-4hzbpn leading-[28px]">{`68.5 `}</p>
      </div>
      <div className="absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[20px] justify-center left-[49.33px] text-[#6b7280] text-[14px] top-[15.5px] translate-y-[-50%] w-[15.97px]">
        <p className="css-4hzbpn leading-[20px]">kg</p>
      </div>
    </div>
  );
}

function BackgroundShadow3() {
  return (
    <div className="absolute bg-white h-[128px] left-0 right-[173.5px] rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-[140px]" data-name="Background+Shadow">
      <Container24 />
      <Container25 />
      <Paragraph2 />
    </div>
  );
}

function Svg11() {
  return (
    <div className="h-[18px] relative shrink-0 w-[13.5px]" data-name="SVG">
      <div className="absolute inset-[0_-0.04%_0_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.5051 18">
          <g id="SVG">
            <path d={svgPaths.pa35eb80} fill="var(--fill-0, #F0AD4E)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg11 />
    </div>
  );
}

function Background6() {
  return (
    <div className="bg-[#fef9c3] content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[40px]" data-name="Background">
      <Container26 />
    </div>
  );
}

function Background7() {
  return (
    <div className="bg-[#fef9c3] content-stretch flex flex-col items-start px-[10px] py-[4px] relative rounded-[9999px] shrink-0" data-name="Background">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#f0ad4e] text-[12px] w-[41.16px]">
        <p className="css-4hzbpn leading-[16px]">Review</p>
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="absolute content-stretch flex items-center justify-between left-[16px] right-[16px] top-[16px]" data-name="Container">
      <Background6 />
      <Background7 />
    </div>
  );
}

function Container28() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[16px] right-[16px] top-[64px]" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-[75.05px]">
        <p className="css-4hzbpn leading-[16px]">Sleep Quality</p>
      </div>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="absolute h-[28px] leading-[0] left-[16px] not-italic right-[16px] top-[84px]" data-name="Paragraph">
      <div className="absolute flex flex-col font-['Inter:Bold',sans-serif] font-bold h-[28px] justify-center left-0 text-[#1f2937] text-[20px] top-[14px] translate-y-[-50%] w-[36.41px]">
        <p className="css-4hzbpn leading-[28px]">{`6.2 `}</p>
      </div>
      <div className="absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[20px] justify-center left-[36.41px] text-[#6b7280] text-[14px] top-[15.5px] translate-y-[-50%] w-[20.95px]">
        <p className="css-4hzbpn leading-[20px]">hrs</p>
      </div>
    </div>
  );
}

function BackgroundShadow4() {
  return (
    <div className="absolute bg-white h-[128px] left-[173.5px] right-0 rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-[140px]" data-name="Background+Shadow">
      <Container27 />
      <Container28 />
      <Paragraph3 />
    </div>
  );
}

function Container29() {
  return (
    <div className="h-[268px] relative shrink-0 w-full" data-name="Container">
      <BackgroundShadow1 />
      <BackgroundShadow2 />
      <BackgroundShadow3 />
      <BackgroundShadow4 />
    </div>
  );
}

function Section2() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start pb-0 pt-[24px] px-0 relative shrink-0 w-full" data-name="Section">
      <Heading2 />
      <Container29 />
    </div>
  );
}

function Heading3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#1f2937] text-[18px] w-[121.17px]">
        <p className="css-4hzbpn leading-[28px]">Quick Actions</p>
      </div>
    </div>
  );
}

function Svg12() {
  return (
    <div className="h-[20px] relative shrink-0 w-[15px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 20">
        <g id="SVG">
          <path d={svgPaths.p27bb0600} fill="var(--fill-0, #4A90E2)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container30() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg12 />
    </div>
  );
}

function Background8() {
  return (
    <div className="bg-[#dbeafe] content-stretch flex items-center justify-center relative rounded-[12px] shrink-0 size-[48px]" data-name="Background">
      <Container30 />
    </div>
  );
}

function Container31() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-[20px] justify-center leading-[0] not-italic relative shrink-0 text-[#1f2937] text-[14px] w-[131.34px]">
        <p className="css-4hzbpn leading-[20px]">Health Assessment</p>
      </div>
    </div>
  );
}

function Container32() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-[179.23px]">
        <p className="css-4hzbpn leading-[16px]">Complete your weekly check-in</p>
      </div>
    </div>
  );
}

function Container33() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Container31 />
      <Container32 />
    </div>
  );
}

function Container34() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="Container">
      <Background8 />
      <Container33 />
    </div>
  );
}

function Svg13() {
  return (
    <div className="h-[16px] relative shrink-0 w-[10px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 16">
        <g id="SVG">
          <path d={svgPaths.p20766000} fill="var(--fill-0, #9CA3AF)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container35() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg13 />
    </div>
  );
}

function Button7() {
  return (
    <div className="bg-white relative rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 w-full" data-name="Button">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between p-[16px] relative w-full">
          <Container34 />
          <Container35 />
        </div>
      </div>
    </div>
  );
}

function Svg14() {
  return (
    <div className="h-[20px] relative shrink-0 w-[25px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.0004 20">
        <g id="SVG">
          <path d={svgPaths.p2ae4e2d8} fill="var(--fill-0, #5CB85C)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container36() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg14 />
    </div>
  );
}

function Background9() {
  return (
    <div className="bg-[#dcfce7] content-stretch flex items-center justify-center relative rounded-[12px] shrink-0 size-[48px]" data-name="Background">
      <Container36 />
    </div>
  );
}

function Container37() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-[20px] justify-center leading-[0] not-italic relative shrink-0 text-[#1f2937] text-[14px] w-[132.98px]">
        <p className="css-4hzbpn leading-[20px]">{`Dialog & Next Steps`}</p>
      </div>
    </div>
  );
}

function Container38() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-[133.17px]">
        <p className="css-4hzbpn leading-[16px]">View recommendations</p>
      </div>
    </div>
  );
}

function Container39() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Container37 />
      <Container38 />
    </div>
  );
}

function Container40() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="Container">
      <Background9 />
      <Container39 />
    </div>
  );
}

function Background10() {
  return (
    <div className="bg-[#d9534f] content-stretch flex items-center justify-center pb-[2.5px] pt-[1.5px] px-0 relative rounded-[9999px] shrink-0 size-[20px]" data-name="Background">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-white w-[7.48px]">
        <p className="css-4hzbpn leading-[16px]">2</p>
      </div>
    </div>
  );
}

function Svg15() {
  return (
    <div className="h-[16px] relative shrink-0 w-[10px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 16">
        <g id="SVG">
          <path d={svgPaths.p20766000} fill="var(--fill-0, #9CA3AF)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container41() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg15 />
    </div>
  );
}

function Container42() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Container">
      <Background10 />
      <Container41 />
    </div>
  );
}

function Button8() {
  return (
    <div className="bg-white relative rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 w-full" data-name="Button">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between p-[16px] relative w-full">
          <Container40 />
          <Container42 />
        </div>
      </div>
    </div>
  );
}

function Svg16() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="SVG">
          <path d={svgPaths.p20602f00} fill="var(--fill-0, #9333EA)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container43() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg16 />
    </div>
  );
}

function Background11() {
  return (
    <div className="bg-[#f3e8ff] content-stretch flex items-center justify-center relative rounded-[12px] shrink-0 size-[48px]" data-name="Background">
      <Container43 />
    </div>
  );
}

function Container44() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-[20px] justify-center leading-[0] not-italic relative shrink-0 text-[#1f2937] text-[14px] w-[116.42px]">
        <p className="css-4hzbpn leading-[20px]">Personal Insights</p>
      </div>
    </div>
  );
}

function Container45() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-[114.05px]">
        <p className="css-4hzbpn leading-[16px]">Track your progress</p>
      </div>
    </div>
  );
}

function Container46() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Container44 />
      <Container45 />
    </div>
  );
}

function Container47() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="Container">
      <Background11 />
      <Container46 />
    </div>
  );
}

function Svg17() {
  return (
    <div className="h-[16px] relative shrink-0 w-[10px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 16">
        <g id="SVG">
          <path d={svgPaths.p20766000} fill="var(--fill-0, #9CA3AF)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container48() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg17 />
    </div>
  );
}

function Button9() {
  return (
    <div className="bg-white relative rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 w-full" data-name="Button">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between p-[16px] relative w-full">
          <Container47 />
          <Container48 />
        </div>
      </div>
    </div>
  );
}

function Container49() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <Button7 />
      <Button8 />
      <Button9 />
    </div>
  );
}

function Section3() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start px-0 py-[24px] relative shrink-0 w-full" data-name="Section">
      <Heading3 />
      <Container49 />
    </div>
  );
}

function Heading4() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-[24px] justify-center leading-[0] not-italic relative shrink-0 text-[#1f2937] text-[16px] w-[106.22px]">
        <p className="css-4hzbpn leading-[24px]">Weekly Trend</p>
      </div>
    </div>
  );
}

function Button10() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0" data-name="Button">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#4a90e2] text-[12px] text-center w-[46.09px]">
        <p className="css-4hzbpn leading-[16px]">View All</p>
      </div>
    </div>
  );
}

function Container50() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Heading4 />
      <Button10 />
    </div>
  );
}

function Container51() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-center min-h-px min-w-px pb-0 pt-[8px] px-0 relative" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-[25.14px]">
        <p className="css-4hzbpn leading-[16px]">Mon</p>
      </div>
    </div>
  );
}

function Container52() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-center min-h-px min-w-px pb-0 pt-[8px] px-0 relative" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-[20.96px]">
        <p className="css-4hzbpn leading-[16px]">Tue</p>
      </div>
    </div>
  );
}

function Container53() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-center min-h-px min-w-px pb-0 pt-[8px] px-0 relative" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-[25.57px]">
        <p className="css-4hzbpn leading-[16px]">Wed</p>
      </div>
    </div>
  );
}

function Container54() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-center min-h-px min-w-px pb-0 pt-[8px] px-0 relative" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-[21.95px]">
        <p className="css-4hzbpn leading-[16px]">Thu</p>
      </div>
    </div>
  );
}

function Container55() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-center min-h-px min-w-px pb-0 pt-[8px] px-0 relative" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-[14.29px]">
        <p className="css-4hzbpn leading-[16px]">Fri</p>
      </div>
    </div>
  );
}

function Container56() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-center min-h-px min-w-px pb-0 pt-[8px] px-0 relative" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-[18.39px]">
        <p className="css-4hzbpn leading-[16px]">Sat</p>
      </div>
    </div>
  );
}

function Container57() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-center min-h-px min-w-px pb-0 pt-[8px] px-0 relative" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-[21.9px]">
        <p className="css-4hzbpn leading-[16px]">Sun</p>
      </div>
    </div>
  );
}

function Container58() {
  return (
    <div className="h-[128px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-end size-full">
        <div className="content-stretch flex items-end justify-between pl-0 pr-[0.05px] py-0 relative size-full">
          <Container51 />
          <Container52 />
          <Container53 />
          <Container54 />
          <Container55 />
          <Container56 />
          <Container57 />
        </div>
      </div>
    </div>
  );
}

function Container59() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] text-center w-[253.53px]">
        <p className="css-4hzbpn leading-[16px]">Activity Level - Excellent progress this week!</p>
      </div>
    </div>
  );
}

function Section4() {
  return (
    <div className="bg-white relative rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 w-full" data-name="Section">
      <div className="content-stretch flex flex-col gap-[16px] items-start p-[16px] relative w-full">
        <Container50 />
        <Container58 />
        <Container59 />
      </div>
    </div>
  );
}

function Heading5() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#1f2937] text-[18px] w-[89.14px]">
        <p className="css-4hzbpn leading-[28px]">Upcoming</p>
      </div>
    </div>
  );
}

function Svg18() {
  return (
    <div className="h-[18px] relative shrink-0 w-[15.75px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.75 18">
        <g id="SVG">
          <path d={svgPaths.p3cbdb600} fill="var(--fill-0, #F0AD4E)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container60() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg18 />
    </div>
  );
}

function Background12() {
  return (
    <div className="bg-[#ffedd5] content-stretch flex items-center justify-center relative rounded-[12px] shrink-0 size-[48px]" data-name="Background">
      <Container60 />
    </div>
  );
}

function Container61() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#1f2937] text-[14px] w-[157.35px]">
        <p className="css-4hzbpn leading-[20px]">Follow-up Consultation</p>
      </div>
    </div>
  );
}

function Container62() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[12px] w-[142.68px]">
        <p className="css-4hzbpn leading-[16px]">Dr. Martinez - Cardiology</p>
      </div>
    </div>
  );
}

function Svg19() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="SVG">
          <path d={svgPaths.p1fc4f490} fill="var(--fill-0, #9CA3AF)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container63() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg19 />
    </div>
  );
}

function Container64() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#4b5563] text-[12px] w-[116.88px]">
        <p className="css-4hzbpn leading-[16px]">Tomorrow, 10:30 AM</p>
      </div>
    </div>
  );
}

function Container65() {
  return (
    <div className="content-stretch flex gap-[8px] items-center pb-0 pt-[4px] px-0 relative shrink-0 w-full" data-name="Container">
      <Container63 />
      <Container64 />
    </div>
  );
}

function Container66() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Container">
      <Container61 />
      <Container62 />
      <Container65 />
    </div>
  );
}

function Button11() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0" data-name="Button">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[#4a90e2] text-[12px] text-center w-[39.19px]">
        <p className="css-4hzbpn leading-[16px]">Details</p>
      </div>
    </div>
  );
}

function Container67() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <Background12 />
      <Container66 />
      <Button11 />
    </div>
  );
}

function BackgroundShadow5() {
  return (
    <div className="bg-white relative rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 w-full" data-name="Background+Shadow">
      <div className="content-stretch flex flex-col items-start p-[16px] relative w-full">
        <Container67 />
      </div>
    </div>
  );
}

function Section5() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start pb-0 pt-[24px] px-0 relative shrink-0 w-full" data-name="Section">
      <Heading5 />
      <BackgroundShadow5 />
    </div>
  );
}

function Main() {
  return (
    <div className="relative shrink-0 w-full z-[1]" data-name="Main">
      <div className="content-stretch flex flex-col items-start pb-[120px] pt-0 px-[20px] relative w-full">
        <Section />
        <Section1 />
        <Section2 />
        <Section3 />
        <Section4 />
        <Section5 />
      </div>
    </div>
  );
}

function Background13() {
  return (
    <div className="bg-[#f7f9fc] content-stretch flex flex-col isolate items-start max-w-[375px] min-h-[1588px] relative shrink-0 w-full" data-name="Background">
      <Header />
      <Main />
    </div>
  );
}

function Heading6() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Heading 2">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold h-[28px] justify-center leading-[0] not-italic relative shrink-0 text-[#1f2937] text-[20px] w-[55.45px]">
        <p className="css-4hzbpn leading-[28px]">Menu</p>
      </div>
    </div>
  );
}

function Svg20() {
  return (
    <div className="h-[20px] relative shrink-0 w-[15px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 20">
        <g id="SVG">
          <path d={svgPaths.pe338fc0} fill="var(--fill-0, #374151)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container68() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg20 />
    </div>
  );
}

function Button12() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[40px]" data-name="Button">
      <Container68 />
    </div>
  );
}

function Container69() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative w-full">
        <Heading6 />
        <Button12 />
      </div>
    </div>
  );
}

function Profile1() {
  return (
    <div className="max-w-[240px] pointer-events-none relative rounded-[9999px] shrink-0 size-[56px]" data-name="Profile">
      <div className="absolute inset-0 overflow-hidden rounded-[9999px]">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgProfile} />
      </div>
      <div aria-hidden="true" className="absolute border-2 border-[#4a90e2] border-solid inset-0 rounded-[9999px]" />
    </div>
  );
}

function Container70() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-[24px] justify-center leading-[0] not-italic relative shrink-0 text-[#1f2937] text-[16px] w-[115.75px]">
        <p className="css-4hzbpn leading-[24px]">Sarah Johnson</p>
      </div>
    </div>
  );
}

function Container71() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[14px] w-[112.19px]">
        <p className="css-4hzbpn leading-[20px]">Patient ID: 28491</p>
      </div>
    </div>
  );
}

function Container72() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Container70 />
      <Container71 />
    </div>
  );
}

function Container73() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative w-full">
        <Profile1 />
        <Container72 />
      </div>
    </div>
  );
}

function HorizontalBorder() {
  return (
    <div className="relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden="true" className="absolute border-[#e5e7eb] border-b border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex flex-col gap-[16px] items-start pb-[21px] pt-[20px] px-[20px] relative w-full">
        <Container69 />
        <Container73 />
      </div>
    </div>
  );
}

function Svg21() {
  return (
    <div className="h-[16px] relative shrink-0 w-[18px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 16">
        <g id="SVG">
          <path d={svgPaths.p333a0800} fill="var(--fill-0, #4B5563)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container74() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg21 />
    </div>
  );
}

function Container75() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[24px] justify-center leading-[0] not-italic relative shrink-0 text-[#374151] text-[16px] w-[83.45px]">
        <p className="css-4hzbpn leading-[24px]">Dashboard</p>
      </div>
    </div>
  );
}

function Link() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center px-[16px] py-[12px] relative w-full">
          <Container74 />
          <Container75 />
        </div>
      </div>
    </div>
  );
}

function Svg22() {
  return (
    <div className="h-[16px] relative shrink-0 w-[12px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 16">
        <g id="SVG">
          <path d={svgPaths.pf19be00} fill="var(--fill-0, #4B5563)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container76() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg22 />
    </div>
  );
}

function Container77() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[24px] justify-center leading-[0] not-italic relative shrink-0 text-[#374151] text-[16px] w-[102.31px]">
        <p className="css-4hzbpn leading-[24px]">Assessments</p>
      </div>
    </div>
  );
}

function Link1() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center px-[16px] py-[12px] relative w-full">
          <Container76 />
          <Container77 />
        </div>
      </div>
    </div>
  );
}

function Svg23() {
  return (
    <div className="h-[16px] relative shrink-0 w-[20px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.0003 16">
        <g id="SVG">
          <path d={svgPaths.p1c6a8200} fill="var(--fill-0, #4B5563)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container78() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg23 />
    </div>
  );
}

function Container79() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[24px] justify-center leading-[0] not-italic relative shrink-0 text-[#374151] text-[16px] w-[125.11px]">
        <p className="css-4hzbpn leading-[24px]">{`Dialog & Actions`}</p>
      </div>
    </div>
  );
}

function Link2() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center px-[16px] py-[12px] relative w-full">
          <Container78 />
          <Container79 />
        </div>
      </div>
    </div>
  );
}

function Svg24() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.p319576a0} fill="var(--fill-0, #4B5563)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container80() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg24 />
    </div>
  );
}

function Container81() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[24px] justify-center leading-[0] not-italic relative shrink-0 text-[#374151] text-[16px] w-[60.09px]">
        <p className="css-4hzbpn leading-[24px]">Insights</p>
      </div>
    </div>
  );
}

function Link3() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center px-[16px] py-[12px] relative w-full">
          <Container80 />
          <Container81 />
        </div>
      </div>
    </div>
  );
}

function Svg25() {
  return (
    <div className="h-[16px] relative shrink-0 w-[14px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 16">
        <g id="SVG">
          <path d={svgPaths.pbfb828} fill="var(--fill-0, #4B5563)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container82() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg25 />
    </div>
  );
}

function Container83() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[24px] justify-center leading-[0] not-italic relative shrink-0 text-[#374151] text-[16px] w-[107.05px]">
        <p className="css-4hzbpn leading-[24px]">Appointments</p>
      </div>
    </div>
  );
}

function Link4() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center px-[16px] py-[12px] relative w-full">
          <Container82 />
          <Container83 />
        </div>
      </div>
    </div>
  );
}

function Svg26() {
  return (
    <div className="h-[16px] relative shrink-0 w-[12px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 16">
        <g id="SVG">
          <path d={svgPaths.p3a90d500} fill="var(--fill-0, #4B5563)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container84() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg26 />
    </div>
  );
}

function Container85() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[24px] justify-center leading-[0] not-italic relative shrink-0 text-[#374151] text-[16px] w-[127.53px]">
        <p className="css-4hzbpn leading-[24px]">Medical Records</p>
      </div>
    </div>
  );
}

function Link5() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center pb-[20px] pt-[12px] px-[16px] relative w-full">
          <Container84 />
          <Container85 />
        </div>
      </div>
    </div>
  );
}

function Svg27() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.p52b6200} fill="var(--fill-0, #4B5563)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container86() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg27 />
    </div>
  );
}

function Container87() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[24px] justify-center leading-[0] not-italic relative shrink-0 text-[#374151] text-[16px] w-[62.77px]">
        <p className="css-4hzbpn leading-[24px]">Settings</p>
      </div>
    </div>
  );
}

function Link6() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center pb-[12px] pt-[20px] px-[16px] relative w-full">
          <Container86 />
          <Container87 />
        </div>
      </div>
    </div>
  );
}

function Svg28() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.p1617280} fill="var(--fill-0, #4B5563)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container88() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg28 />
    </div>
  );
}

function Container89() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[24px] justify-center leading-[0] not-italic relative shrink-0 text-[#374151] text-[16px] w-[115.53px]">
        <p className="css-4hzbpn leading-[24px]">{`Help & Support`}</p>
      </div>
    </div>
  );
}

function Link7() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full" data-name="Link">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center px-[16px] py-[12px] relative w-full">
          <Container88 />
          <Container89 />
        </div>
      </div>
    </div>
  );
}

function Nav1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Nav">
      <div className="content-stretch flex flex-col gap-[8px] items-start p-[20px] relative w-full">
        <Link />
        <Link1 />
        <Link2 />
        <Link3 />
        <Link4 />
        <Link5 />
        <div className="h-px relative shrink-0 w-full" data-name="Horizontal Divider">
          <div aria-hidden="true" className="absolute border-[#e5e7eb] border-solid border-t inset-0 pointer-events-none" />
        </div>
        <Link6 />
        <Link7 />
      </div>
    </div>
  );
}

function BackgroundShadow6() {
  return (
    <div className="absolute bg-white content-stretch flex flex-col h-[1588px] items-start left-[-280px] overflow-clip shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] top-0 w-[280px]" data-name="Background+Shadow">
      <HorizontalBorder />
      <Nav1 />
    </div>
  );
}

export default function Body() {
  return (
    <div className="bg-[#f7f9fc] content-stretch flex flex-col items-start relative size-full" data-name="Body">
      <Nav />
      <Background13 />
      <BackgroundShadow6 />
    </div>
  );
}