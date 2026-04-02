import Head from "next/head";
import React, { useEffect, useState } from "react";
import Wrapper from "../../../../components/dashboard/wrapper";
import { Heading, Progress, joinClasses } from "ui";
import Image from "next/image";
import { IoCheckmarkCircle, IoLockClosedOutline, IoPlayCircleOutline, IoDownloadOutline, IoCodeSlashOutline, IoLayersOutline, IoChevronForward } from "react-icons/io5";
import { useRouter } from "next/router";
import courseService from "../../../../services/courseService";

const defaultModules = [
  { id: "01", title: "Foundations of Perceptrons", duration: "15:30", status: "COMPLETED" },
  { id: "02", title: "Activation Functions & Non-linearity", duration: "22:15", status: "COMPLETED" },
  { id: "03", title: "Gradient Descent & Optimization", duration: "", status: "CURRENT", label: "START MODULE" },
  { id: "04", title: "Multilayer Perceptrons (MLP)", duration: "", status: "LOCKED" },
];

const CourseDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    courseService.getCourseById(id as string)
      .then((data) => {
        setCourse(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load course details");
        setLoading(false);
      });
  }, [id]);

  // Fallback UI for loading/error
  if (loading) return <div className="text-white p-10">Loading course details...</div>;
  if (error) return <div className="text-red-500 p-10">{error}</div>;
  if (!course) return <div className="text-white p-10">No course found.</div>;

  // Example: Use course fields, fallback to mock if missing
  const modules = course.class_schedules || defaultModules;
  return (
    <>
      <Head>
        <title>{course.title || "Course Content"} | Candleweb</title>
      </Head>
      <Wrapper>
        <div className="dash__content space-y-12 pb-20">
          {/* Main Content Area */}
          <div className="flex flex-col xl:flex-row gap-10 text-white min-h-screen">
            <div className="flex-1 space-y-10">
              {/* Hero Header Section */}
              <div className="relative p-10 lg:p-14 rounded-[48px] overflow-hidden min-h-[400px] flex flex-col justify-end border border-white/5 bg-[#141414] shadow-[0_40px_80px_rgba(0,0,0,0.6)] group">
                 <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#27ECB0]/15 to-transparent"></div>
                    <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-[#27ECB0]/5 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5 grayscale scale-150 group-hover:scale-[1.6] transition-transform duration-[12s]">
                       <Image src={course.thumbnail || course.logo || "/logo.png"} alt="Pattern" layout="fill" objectFit="contain" />
                    </div>
                 </div>
                 
                 <div className="relative z-10 space-y-8">
                   <div className="flex items-center gap-6">
                      <span className="px-5 py-2.5 bg-orange-500/10 text-orange-400 rounded-2xl text-[10px] font-black tracking-[0.25em] uppercase border border-white/5 shadow-xl">{course.category || "Course"}</span>
                      <span className="flex items-center gap-2 text-[10px] font-black tracking-[0.25em] text-gray-500 uppercase">
                         <span className="text-white">⏱</span> {course.total_hours ? `${course.total_hours} HOURS TOTAL` : ""}
                      </span>
                   </div>
                   
                   <div className="max-w-3xl space-y-5">
                      <Heading textsize="md" classstyle="text-4xl lg:text-7xl font-black tracking-tight leading-[1.05] text-white uppercase italic">{course.title}</Heading>
                      <p className="text-gray-400 leading-relaxed text-base lg:text-lg font-medium max-w-2xl">
                        {course.description}
                      </p>
                   </div>

                   <div className="flex flex-wrap items-center gap-14 pt-8">
                      <div className="flex items-center gap-8 bg-white/5 p-6 rounded-[32px] border border-white/10 shadow-inner">
                         <div className="relative w-24 h-24 flex items-center justify-center p-1.5 bg-background rounded-full border-2 border-white/10 shadow-2xl">
                            <svg className="w-full h-full transform -rotate-90">
                               <circle cx="43" cy="43" r="38" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                               <circle cx="43" cy="43" r="38" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="238.7" strokeDashoffset={course.progress ? 238.7 * (1 - course.progress) : 238.7 * 0.4} className="text-[#27ECB0]" strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xl font-black text-white italic">{course.progress ? `${Math.round(course.progress * 100)}%` : "60%"}</span>
                         </div>
                         <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global Progress</p>
                            <div className="w-44 h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-inner">
                               <div className="h-full bg-[#27ECB0] shadow-[0_0_15px_#27ECB0]" style={{ width: course.progress ? `${Math.round(course.progress * 100)}%` : '60%' }}></div>
                            </div>
                         </div>
                      </div>
                      <button className="px-12 py-6 bg-[#FFB322] hover:bg-white hover:text-black hover:scale-105 active:scale-95 text-black font-black rounded-[24px] flex items-center gap-4 transition-all shadow-[0_20px_40px_rgba(255,179,34,0.3)] group/btn uppercase tracking-widest italic">
                         <IoPlayCircleOutline size={28} className="group-hover/btn:rotate-12 transition-transform" />
                         CONTINUE LEARNING
                      </button>
                   </div>
                 </div>
              </div>

              {/* Syllabus */}
              <div className="bg-[#141414]/90 backdrop-blur-xl rounded-[48px] p-10 lg:p-14 border border-white/5 shadow-2xl space-y-12">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                     <div className="space-y-2 text-center md:text-left">
                        <Heading textsize="sm" classstyle="text-3xl font-black tracking-tight text-white uppercase italic">Course Syllabus</Heading>
                        <p className="text-sm lg:text-base text-gray-500 font-bold tracking-wide uppercase opacity-70">Structured pathway to mastery</p>
                     </div>
                     <div className="px-6 py-3 bg-[#27ECB0]/10 rounded-2xl border border-[#27ECB0]/20 shadow-inner">
                        <span className="text-xs font-black tracking-widest uppercase text-[#27ECB0]">{Array.isArray(modules) ? `${modules.length}` : 0} Modules</span>
                     </div>
                  </div>

                  <div className="space-y-6">
                     {Array.isArray(modules) && modules.length > 0 ? modules.map((m: any, idx: number) => (
                        <div key={m.id || idx} className={joinClasses("p-8 lg:p-10 rounded-[38px] border flex flex-col md:flex-row md:items-center justify-between gap-8 transition-all duration-500 group", 
                          m.status === "COMPLETED" ? "bg-[#1A1A1A]/80 border-[#27ECB0]/20 hover:border-[#27ECB0]/40" : 
                          m.status === "CURRENT" ? "bg-[#1A1A1A] border-[#FFB322]/80 ring-2 ring-[#FFB322]/20 shadow-[0_0_60px_rgba(255,179,34,0.1)]" : "bg-[#101010] border-white/5 opacity-50 hover:opacity-100")}>
                           <div className="flex items-center gap-10">
                              <div className={joinClasses("w-16 h-16 rounded-[22px] flex items-center justify-center transition-all duration-500 group-hover:scale-110", 
                                m.status === "COMPLETED" ? "text-[#27ECB0] bg-[#27ECB0]/10 shadow-inner" : 
                                m.status === "CURRENT" ? "text-[#FFB322] bg-[#FFB322]/10" : "text-gray-700 bg-white/5")}>
                                 {m.status === "COMPLETED" ? <IoCheckmarkCircle size={36} /> : 
                                  m.status === "CURRENT" ? <IoPlayCircleOutline size={36} className="animate-spin-slow" /> : <IoLockClosedOutline size={28} />}
                              </div>
                              <div>
                                 <div className="flex items-center gap-4 mb-2">
                                    <p className={joinClasses("text-[10px] font-black tracking-[0.25em] uppercase", m.status === "CURRENT" ? "text-[#FFB322]" : "text-[#27ECB0]")}>MODULE {m.id || idx+1}</p>
                                    {m.label && <span className="text-[9px] font-black bg-white/10 px-3 py-1 rounded-full text-white uppercase tracking-widest italic">{m.label}</span>}
                                 </div>
                                 <Heading textsize="sm" classstyle={joinClasses("text-xl lg:text-3xl font-black transition-colors uppercase italic", m.status === "LOCKED" ? "text-gray-700" : "text-white group-hover:text-[#27ECB0]")}>{m.topic || m.title}</Heading>
                              </div>
                           </div>
                           <div className="flex items-center justify-between md:justify-end gap-12">
                              {m.duration_minutes && <span className="text-sm font-black text-gray-500 tracking-widest group-hover:text-white transition-colors uppercase italic">{m.duration_minutes} min</span>}
                              {m.status === "CURRENT" && (
                                 <button className="px-10 py-4 bg-[#27ECB0] text-black text-[10px] font-black rounded-2xl border-2 border-transparent hover:bg-transparent hover:text-[#27ECB0] hover:border-[#27ECB0] tracking-[0.25em] transition-all uppercase shadow-2xl italic">Resume Now</button>
                              )}
                              {m.status === "LOCKED" && <span className="text-[10px] font-black tracking-widest uppercase italic text-gray-800">Available in Level 2</span>}
                           </div>
                        </div>
                     )) : <div className="text-gray-400">No modules found.</div>}
                  </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="xl:w-[380px] space-y-8">

              {/* Course Rewards */}
              <div className="bg-[#141414]/80 backdrop-blur-xl p-10 rounded-[48px] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700 pointer-events-none text-[80px] leading-none">
                  🏆
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-400 text-xl shadow-inner">🏆</div>
                  <Heading textsize="sm" classstyle="text-xl font-black tracking-tight text-white uppercase italic">Course Rewards</Heading>
                </div>
                <p className="text-sm text-gray-500 font-semibold leading-relaxed">
                  Complete the course to unlock exclusive terminal access and blockchain credentials.
                </p>
                <div className="space-y-4">
                  {[
                    { label: "Certified NFT Diploma", icon: "🎓" },
                    { label: "500 LMN Credits", icon: "⭐" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-4 p-5 bg-white/5 rounded-[22px] border border-white/5 hover:border-[#27ECB0]/30 transition-all cursor-default group/item hover:bg-white/10">
                      <span className="text-2xl group-hover/item:scale-125 transition-transform duration-500">{r.icon}</span>
                      <span className="text-xs font-black text-gray-300 tracking-widest uppercase">{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div className="bg-[#141414]/80 backdrop-blur-xl p-10 rounded-[48px] border border-white/5 shadow-2xl space-y-8">
                <Heading textsize="sm" classstyle="text-xl font-black tracking-tight text-white uppercase italic">Resources</Heading>
                <div className="space-y-4">
                  {[
                    { title: "Course Slides (PDF)", icon: <IoDownloadOutline size={20} /> },
                    { title: "Python Source Code", icon: <IoCodeSlashOutline size={20} /> },
                    { title: "Sample Datasets", icon: <IoLayersOutline size={20} /> },
                  ].map((res, i) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-[22px] transition-all cursor-pointer group border border-white/5 hover:border-[#27ECB0]/25">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400 group-hover:text-[#27ECB0] transition-colors">{res.icon}</span>
                        <span className="text-xs font-black text-gray-400 group-hover:text-white transition-colors tracking-widest uppercase">{res.title}</span>
                      </div>
                      <IoChevronForward className="text-gray-700 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 group-hover:text-[#27ECB0]" />
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Mentor CTA */}
              <div className="bg-gradient-to-br from-[#1A1812] to-[#0F0F0E] p-10 rounded-[48px] border border-[#FFB322]/20 relative overflow-hidden group shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#FFB322]/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-[2s]"></div>
                <div className="relative flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-[#FFB322]/10 rounded-2xl flex items-center justify-center text-xl shadow-inner">💡</div>
                  <Heading textsize="sm" classstyle="text-sm font-black tracking-tight italic text-white uppercase">Stuck on a problem?</Heading>
                </div>
                <p className="text-sm text-gray-500 mb-10 leading-relaxed font-semibold">
                  Our AI Mentor is available 24/7 to debug your backpropagation logic and answer questions.
                </p>
                <button className="text-[#FFB322] text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-3 hover:gap-6 transition-all duration-300 italic">
                  Launch Assistant <IoChevronForward size={14} className="animate-pulse" />
                </button>
              </div>

              {/* Classmates */}
              <div className="bg-[#141414]/90 backdrop-blur-xl p-10 rounded-[48px] border border-white/5 flex flex-col gap-8 shadow-2xl">
                <div className="flex items-center gap-8">
                  <div className="flex -space-x-4">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-14 h-14 rounded-full border-4 border-[#141414] bg-gray-800 flex items-center justify-center overflow-hidden shadow-xl hover:-translate-y-2 transition-transform cursor-pointer">
                        <Image src="/logo.png" alt={`Student ${i}`} width={50} height={50} />
                      </div>
                    ))}
                    <div className="w-14 h-14 rounded-full border-4 border-[#141414] bg-[#27ECB0] flex items-center justify-center text-xs text-black font-black uppercase shadow-xl">+2.4k</div>
                  </div>
                  <div>
                    <p className="text-xl font-black text-white flex items-center gap-3">
                      2,482
                      <span className="w-2.5 h-2.5 rounded-full bg-[#27ECB0] animate-ping opacity-75 inline-block"></span>
                    </p>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Classmates active now</p>
                  </div>
                </div>
                <button className="w-full py-5 text-[#27ECB0] text-[10px] font-black tracking-[0.2em] uppercase hover:bg-[#27ECB0]/5 rounded-2xl border border-[#27ECB0]/20 transition-all flex items-center justify-center gap-3 active:scale-95 group/forum italic">
                  Visit Class Forum <IoChevronForward className="group-hover/forum:translate-x-2 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Wrapper>
    </>
  );
};

export default CourseDetails;
