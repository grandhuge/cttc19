
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Book, Plus, Users, AlertCircle } from 'lucide-react';
import GameHeader from '@/components/GameHeader';

const WelfareGame = ({ gameState, updateGameState, onBack }) => {
  // Use persistent data from gameState with proper initialization
  const welfareData = gameState.welfareData || {
    committee: { members: 5, meetings: 0, decisions: [] },
    welfareProjects: [],
    completedProjects: [],
    memberNeeds: [],
    currentNeed: null,
    lastUpdate: Date.now()
  };

  const [welfareProjects, setWelfareProjects] = useState(welfareData.welfareProjects);
  const [completedProjects, setCompletedProjects] = useState(welfareData.completedProjects);
  const [committee, setCommittee] = useState(welfareData.committee);
  const [memberNeeds, setMemberNeeds] = useState(welfareData.memberNeeds);
  const [currentNeed, setCurrentNeed] = useState(welfareData.currentNeed);

  // Persistent project progress - continues even when switching games
  useEffect(() => {
    const lastUpdate = welfareData.lastUpdate || Date.now();
    const now = Date.now();
    const timePassed = now - lastUpdate;

    // Update progress for all active projects based on time passed
    if (timePassed > 0 && welfareProjects.length > 0) {
      const updatedProjects = welfareProjects.map(project => {
        if (project.progress < 100) {
          const progressIncrease = (timePassed / 1000) * (100 / project.duration);
          const newProgress = Math.min(100, project.progress + progressIncrease);
          return { ...project, progress: newProgress };
        }
        return project;
      });
      setWelfareProjects(updatedProjects);
    }
  }, []);

  // Update gameState whenever local state changes
  useEffect(() => {
    updateGameState({
      welfareData: {
        committee,
        welfareProjects,
        completedProjects,
        memberNeeds,
        currentNeed,
        lastUpdate: Date.now()
      }
    });
  }, [committee, welfareProjects, completedProjects, memberNeeds, currentNeed]);

  // Member needs system
  const needsTypes = [
    {
      id: 'financial_aid',
      title: '💰 ช่วยเหลือทางการเงิน',
      description: 'สมาชิกต้องการความช่วยเหลือค่าใช้จ่ายในการเรียน',
      urgency: 'high',
      matchingProjects: ['scholarship'],
      satisfaction: 25,
      popularity: 20
    },
    {
      id: 'health_support',
      title: '🏥 สุขภาพและการดูแล',
      description: 'สมาชิกต้องการบริการด้านสุขภาพและการตรวจสุขภาพ',
      urgency: 'medium',
      matchingProjects: ['health_check'],
      satisfaction: 15,
      popularity: 12
    },
    {
      id: 'learning_experience',
      title: '📚 ประสบการณ์การเรียนรู้',
      description: 'สมาชิกต้องการกิจกรรมเสริมประสบการณ์นอกห้องเรียน',
      urgency: 'medium',
      matchingProjects: ['educational_trip', 'library_books'],
      satisfaction: 18,
      popularity: 15
    },
    {
      id: 'recreation',
      title: '⚽ กีฬาและนันทนาการ',
      description: 'สมาชิกต้องการอุปกรณ์และกิจกรรมด้านกีฬา',
      urgency: 'low',
      matchingProjects: ['sports_equipment'],
      satisfaction: 10,
      popularity: 8
    }
  ];

  const projectTypes = [
    {
      id: 'scholarship',
      name: '🎓 ทุนการศึกษา',
      cost: 2000,
      duration: 60,
      impact: 'ช่วยเหลือนักเรียนที่ขาดแคลนทุนทรัพย์',
      popularityBoost: 15,
      experience: 50
    },
    {
      id: 'health_check',
      name: '🏥 ตรวจสุขภาพ',
      cost: 1500,
      duration: 45,
      impact: 'จัดการตรวจสุขภาพให้นักเรียนฟรี',
      popularityBoost: 10,
      experience: 35
    },
    {
      id: 'educational_trip',
      name: '🚌 ทัศนศึกษา',
      cost: 3000,
      duration: 90,
      impact: 'จัดทริปเรียนรู้นอกสถานที่',
      popularityBoost: 20,
      experience: 60
    },
    {
      id: 'sports_equipment',
      name: '⚽ อุปกรณ์กีฬา',
      cost: 1000,
      duration: 30,
      impact: 'จัดหาอุปกรณ์กีฬาสำหรับนักเรียน',
      popularityBoost: 8,
      experience: 25
    },
    {
      id: 'library_books',
      name: '📚 หนังสือห้องสมุด',
      cost: 800,
      duration: 40,
      impact: 'จัดซื้อหนังสือเพิ่มเติมให้ห้องสมุด',
      popularityBoost: 12,
      experience: 30
    }
  ];

  const [meetingTopics] = useState([
    'วางแผนกิจกรรมช่วยเหลือนักเรียนยากจน',
    'จัดหาอุปกรณ์การเรียนการสอน',
    'วางแผนงบประมาณประจำปี',
    'ประเมินผลกิจกรรมที่ผ่านมา',
    'วางแผนกิจกรรมส่งเสริมความสามัคคี'
  ]);

  // Generate random member needs
  useEffect(() => {
    const generateNeed = () => {
      if (Math.random() < 0.3) {
        const availableNeeds = needsTypes.filter(need => 
          !memberNeeds.some(existing => existing.id === need.id)
        );
        
        if (availableNeeds.length > 0) {
          const randomNeed = availableNeeds[Math.floor(Math.random() * availableNeeds.length)];
          const newNeed = {
            ...randomNeed,
            timestamp: Date.now(),
            expires: Date.now() + 120000
          };
          
          setMemberNeeds(prev => [...prev, newNeed]);
          setCurrentNeed(newNeed);
        }
      }
    };

    const interval = setInterval(generateNeed, 10000);
    return () => clearInterval(interval);
  }, [memberNeeds]);

  // Remove expired needs
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setMemberNeeds(prev => prev.filter(need => need.expires > now));
    }, 5000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Real-time project progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setWelfareProjects(prev => prev.map(project => {
        if (project.progress < 100) {
          const newProgress = Math.min(100, project.progress + (100 / project.duration));
          return { ...project, progress: newProgress };
        }
        return project;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const startProject = (projectType) => {
    if (gameState.money < projectType.cost) {
      alert('งบประมาณไม่พอ! ต้องใช้เงิน ' + projectType.cost + ' บาท');
      return;
    }

    const matchingNeed = memberNeeds.find(need => 
      need.matchingProjects.includes(projectType.id)
    );

    let bonusRewards = { satisfaction: 0, popularity: 0 };
    if (matchingNeed) {
      bonusRewards = {
        satisfaction: matchingNeed.satisfaction,
        popularity: matchingNeed.popularity
      };
      
      const updatedNeeds = memberNeeds.filter(need => need.id !== matchingNeed.id);
      setMemberNeeds(updatedNeeds);
      if (currentNeed && currentNeed.id === matchingNeed.id) {
        setCurrentNeed(null);
      }
    }

    const randomTopic = meetingTopics[Math.floor(Math.random() * meetingTopics.length)];
    const updatedCommittee = {
      ...committee,
      meetings: committee.meetings + 1,
      decisions: [...committee.decisions, {
        topic: randomTopic,
        project: projectType.name,
        time: new Date().toLocaleTimeString('th-TH'),
        needMatched: !!matchingNeed
      }]
    };
    setCommittee(updatedCommittee);

    const newProject = {
      id: Date.now(),
      ...projectType,
      progress: 0,
      startTime: Date.now(),
      bonusRewards
    };

    setWelfareProjects(prev => [...prev, newProject]);
    updateGameState({ money: gameState.money - projectType.cost });
    
    let alertMessage = `📋 การประชุมคณะกรรมการ\nหัวข้อ: ${randomTopic}\nมติ: อนุมัติดำเนินการ "${projectType.name}"`;
    
    if (matchingNeed) {
      alertMessage += `\n\n🎯 ตรงกับความต้องการสมาชิก!\n"${matchingNeed.title}"\n✨ โบนัส: ความพึงพอใจ +${matchingNeed.satisfaction}%, ความนิยม +${matchingNeed.popularity}%`;
    }
    
    alert(alertMessage);
  };

  const completeProject = (projectId) => {
    const project = welfareProjects.find(p => p.id === projectId);
    if (project && project.progress >= 100) {
      setWelfareProjects(prev => prev.filter(p => p.id !== projectId));
      setCompletedProjects(prev => [...prev, { ...project, completedAt: new Date() }]);
      
      const totalPopularity = project.popularityBoost + (project.bonusRewards?.popularity || 0);
      const totalSatisfaction = project.bonusRewards?.satisfaction || 0;
      
      const newPopularity = Math.min(100, gameState.storePopularity + totalPopularity);
      const newSatisfaction = Math.min(100, (gameState.storeData?.customerSatisfaction || 80) + totalSatisfaction);
      
      updateGameState({ 
        storePopularity: newPopularity,
        experience: gameState.experience + project.experience,
        welfarePoints: (gameState.welfarePoints || 0) + totalPopularity,
        storeData: {
          ...gameState.storeData,
          customerSatisfaction: newSatisfaction
        }
      });
      
      let alertMessage = `🎉 โครงการเสร็จสิ้น!\n"${project.name}"\n\n✨ ผลกระทบ: ${project.impact}\n📈 ความนิยมร้านเพิ่มขึ้น ${totalPopularity}%\n⭐ ได้รับประสบการณ์ ${project.experience} คะแนน`;
      
      if (project.bonusRewards?.satisfaction) {
        alertMessage += `\n😊 ความพึงพอใจลูกค้าเพิ่มขึ้น ${project.bonusRewards.satisfaction}%`;
      }
      
      alert(alertMessage);
    }
  };

  const holdEmergencyMeeting = () => {
    if (gameState.money < 100) {
      alert('ต้องใช้งบประมาณ 100 บาทในการจัดประชุมฉุกเฉิน');
      return;
    }

    const emergencyTopics = [
      'พิจารณาช่วยเหลือนักเรียนประสบภัยพิบัติ',
      'แก้ไขปัญหาด่วนในโรงเรียน',
      'วางแผนการช่วยเหลือฉุกเฉิน',
      'ประชุมหาแนวทางแก้ไขปัญหาเร่งด่วน'
    ];

    const topic = emergencyTopics[Math.floor(Math.random() * emergencyTopics.length)];
    const boost = Math.floor(Math.random() * 10) + 5;
    
    const updatedCommittee = {
      ...committee,
      meetings: committee.meetings + 1,
      decisions: [...committee.decisions, {
        topic: topic + ' (ฉุกเฉิน)',
        project: 'การประชุมฉุกเฉิน',
        time: new Date().toLocaleTimeString('th-TH'),
        needMatched: false
      }]
    };
    setCommittee(updatedCommittee);

    updateGameState({ 
      money: gameState.money - 100,
      storePopularity: Math.min(100, gameState.storePopularity + boost),
      experience: gameState.experience + 15
    });

    alert(`🚨 การประชุมฉุกเฉิน\nหัวข้อ: ${topic}\nผลลัพธ์: ความนิยมร้านเพิ่มขึ้น ${boost}%`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <GameHeader gameState={gameState} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Book className="mr-3 text-orange-600" />
            การศึกษาและสวัสดิการ
          </h1>
          <Button onClick={onBack} variant="outline" className="px-6">
            กลับหน้าหลัก
          </Button>
        </div>

        {/* Member Needs Alert */}
        {currentNeed && (
          <Card className="mb-6 border-2 border-yellow-400 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800">
                <AlertCircle className="mr-2" />
                ความต้องการของสมาชิก
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{currentNeed.title}</h3>
                  <p className="text-gray-600">{currentNeed.description}</p>
                  <div className="flex items-center mt-2">
                    <Badge variant={currentNeed.urgency === 'high' ? 'destructive' : currentNeed.urgency === 'medium' ? 'default' : 'secondary'}>
                      {currentNeed.urgency === 'high' ? 'เร่งด่วน' : currentNeed.urgency === 'medium' ? 'ปานกลาง' : 'ไม่เร่งด่วน'}
                    </Badge>
                    <span className="ml-3 text-sm text-gray-600">
                      โบนัส: ความพึงพอใจ +{currentNeed.satisfaction}%, ความนิยม +{currentNeed.popularity}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">หมดเวลาใน</p>
                  <p className="font-semibold text-red-600">
                    {Math.max(0, Math.ceil((currentNeed.expires - Date.now()) / 1000))} วินาที
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Committee and Projects */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-center">🏛️ คณะกรรมการ</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">สมาชิกคณะกรรมการ:</span>
                    <div className="text-2xl font-bold text-blue-600">{committee.members} คน</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">การประชุม:</span>
                    <div className="text-xl font-semibold text-green-600">{committee.meetings} ครั้ง</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">คะแนนสวัสดิการ:</span>
                    <div className="text-xl font-semibold text-purple-600">{gameState.welfarePoints || 0} คะแนน</div>
                  </div>
                  <Button 
                    onClick={holdEmergencyMeeting}
                    className="w-full bg-red-500 hover:bg-red-600 text-sm"
                    disabled={gameState.money < 100}
                  >
                    ประชุมฉุกเฉิน (100 บาท)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Member Needs */}
            {memberNeeds.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2" />
                    ความต้องการสมาชิก
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-32 overflow-y-auto">
                    {memberNeeds.map((need) => (
                      <div key={need.id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="font-semibold">{need.title}</div>
                        <div className="text-xs text-gray-600">
                          เหลือเวลา: {Math.max(0, Math.ceil((need.expires - Date.now()) / 1000))} วินาที
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="mr-2" />
                  โครงการสวัสดิการ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectTypes.map((project) => {
                    const matchingNeed = memberNeeds.find(need => 
                      need.matchingProjects.includes(project.id)
                    );
                    
                    return (
                      <Card 
                        key={project.id} 
                        className={`p-3 border transition-shadow ${
                          matchingNeed ? 'border-yellow-400 bg-yellow-50 shadow-md' : 'hover:shadow-md'
                        }`}
                      >
                        <div className="text-center">
                          <h3 className="font-semibold text-sm mb-2 flex items-center justify-center">
                            {project.name}
                            {matchingNeed && <span className="ml-2 text-yellow-600">🎯</span>}
                          </h3>
                          <p className="text-xs text-gray-600 mb-3">{project.impact}</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>งบประมาณ:</span>
                              <span className="font-semibold text-red-600">{project.cost} บาท</span>
                            </div>
                            <div className="flex justify-between">
                              <span>ความนิยม:</span>
                              <span className="font-semibold text-green-600">
                                +{project.popularityBoost + (matchingNeed?.popularity || 0)}%
                                {matchingNeed && <span className="text-yellow-600"> (โบนัส!)</span>}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>ระยะเวลา:</span>
                              <span className="font-semibold text-blue-600">{project.duration} วินาที</span>
                            </div>
                          </div>
                          <Button 
                            onClick={() => startProject(project)}
                            className={`w-full mt-3 text-xs ${
                              matchingNeed 
                                ? 'bg-yellow-500 hover:bg-yellow-600' 
                                : 'bg-orange-500 hover:bg-orange-600'
                            }`}
                            disabled={gameState.money < project.cost}
                            size="sm"
                          >
                            {matchingNeed ? '🎯 เริ่มโครงการ (ตรงความต้องการ!)' : 'เริ่มโครงการ'}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Projects and History */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>🚀 โครงการที่กำลังดำเนินการ</CardTitle>
              </CardHeader>
              <CardContent>
                {welfareProjects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Book className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>ยังไม่มีโครงการที่กำลังดำเนินการ</p>
                    <p className="text-sm">เลือกโครงการจากด้านซ้ายเพื่อเริ่มต้น</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {welfareProjects.map((project) => (
                      <Card key={project.id} className="p-4 border-2 border-gray-200">
                        <div className="text-center">
                          <h3 className="font-semibold text-lg mb-2 flex items-center justify-center">
                            {project.name}
                            {project.bonusRewards?.popularity > 0 && <span className="ml-2 text-yellow-600">🎯</span>}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">{project.impact}</p>
                          <div className="mb-4">
                            <Progress value={project.progress} className="h-3" />
                            <p className="text-sm text-gray-600 mt-1">
                              {Math.round(project.progress)}% เสร็จสิ้น
                            </p>
                          </div>
                          
                          {project.progress >= 100 ? (
                            <div>
                              <Badge className="mb-3 bg-green-500">โครงการเสร็จสิ้น! 🎉</Badge>
                              <Button 
                                onClick={() => completeProject(project.id)}
                                className="w-full bg-green-500 hover:bg-green-600"
                              >
                                รับผลโครงการ
                              </Button>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">
                              <p>ผลกระทบ: +{project.popularityBoost + (project.bonusRewards?.popularity || 0)}% ความนิยม</p>
                              {project.bonusRewards?.satisfaction > 0 && (
                                <p className="text-yellow-600">โบนัส: +{project.bonusRewards.satisfaction}% ความพึงพอใจ</p>
                              )}
                              <p>เหลือเวลาอีกประมาณ {Math.ceil((100 - project.progress) * project.duration / 100)} วินาที</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Committee Decisions History */}
            <Card>
              <CardHeader>
                <CardTitle>📋 ประวัติการประชุม</CardTitle>
              </CardHeader>
              <CardContent>
                {committee.decisions.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p>ยังไม่มีการประชุมคณะกรรมการ</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {committee.decisions.slice(-5).reverse().map((decision, index) => (
                      <div key={index} className={`p-3 rounded-lg ${decision.needMatched ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                        <div className="font-semibold text-sm text-gray-800 flex items-center">
                          {decision.topic}
                          {decision.needMatched && <span className="ml-2 text-yellow-600">🎯</span>}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          โครงการ: {decision.project} | เวลา: {decision.time}
                          {decision.needMatched && <span className="text-yellow-600 ml-2">✨ ตรงความต้องการสมาชิก</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completed Projects */}
            {completedProjects.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>✅ โครงการที่เสร็จสิ้นแล้ว</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {completedProjects.slice(-6).map((project, index) => (
                      <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="font-semibold text-sm text-green-800 flex items-center">
                          {project.name}
                          {project.bonusRewards?.popularity > 0 && <span className="ml-2 text-yellow-600">🎯</span>}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          ผลกระทบ: +{project.popularityBoost + (project.bonusRewards?.popularity || 0)}% ความนิยม
                          {project.bonusRewards?.satisfaction > 0 && (
                            <span className="text-yellow-600 ml-2">+{project.bonusRewards.satisfaction}% ความพึงพอใจ</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelfareGame;
