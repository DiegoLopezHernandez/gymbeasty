import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle, Ellipse, Defs, RadialGradient as SvgRadial, LinearGradient as SvgLinear, Stop, Line, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Radius, Spacing } from '../constants/theme';
import { useTheme } from './ui';
import { RANK_DATA, getLevelProgress } from '../utils/calculations';

interface Props { tier: number; gymLevel: number; xp: number; totalWorkouts: number; streak: number; }

function getBodyStage(l: number): 0|1|2|3|4|5 {
  if(l<=4)return 0;if(l<=9)return 1;if(l<=14)return 2;if(l<=19)return 3;if(l<=24)return 4;return 5;
}

const SP = [
  {sW:22,wW:13,hW:16,tH:46,uA:5, fA:4, tq:9, ca:6, lH:52,hR:14,pec:false,ps:0, nW:7, abs:false,trap:false,vein:false},
  {sW:28,wW:16,hW:19,tH:48,uA:7, fA:6, tq:12,ca:8, lH:52,hR:15,pec:false,ps:0, nW:8, abs:false,trap:false,vein:false},
  {sW:35,wW:18,hW:22,tH:50,uA:11,fA:8, tq:15,ca:10,lH:53,hR:15,pec:true, ps:8, nW:9, abs:true, trap:false,vein:false},
  {sW:42,wW:20,hW:25,tH:52,uA:14,fA:11,tq:19,ca:13,lH:54,hR:16,pec:true, ps:11,nW:11,abs:true, trap:true, vein:false},
  {sW:48,wW:22,hW:28,tH:54,uA:17,fA:14,tq:23,ca:16,lH:55,hR:17,pec:true, ps:14,nW:13,abs:true, trap:true, vein:false},
  {sW:54,wW:24,hW:31,tH:56,uA:21,fA:17,tq:27,ca:19,lH:56,hR:18,pec:true, ps:17,nW:15,abs:true, trap:true, vein:true},
];

const Fig: React.FC<{level:number;color:string;dark:boolean}> = ({level,color,dark}) => {
  const st=getBodyStage(level), p=SP[st];
  const cx=70,skin=dark?'#C8A882':'#D4B896',skinD=dark?'#A8885A':'#B8987A';
  const headY=22,neckT=headY+p.hR-2,neckB=neckT+10,shY=neckB+2;
  const torsoB=shY+p.tH,kneeY=torsoB+p.lH*0.48,legB=torsoB+p.lH;
  const armT=shY+4,elbowY=armT+36,wristY=elbowY+26;
  const lSh=cx-p.sW,rSh=cx+p.sW;
  return (
    <Svg width={140} height={200} viewBox="0 0 140 200">
      <Defs>
        <SvgRadial id="aura" cx="50%" cy="45%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={String(0.12+st*0.045)}/>
          <Stop offset="1" stopColor={color} stopOpacity="0"/>
        </SvgRadial>
        <SvgLinear id="sk" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={skin}/><Stop offset="1" stopColor={skinD}/>
        </SvgLinear>
        <SvgLinear id="sh" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.9"/><Stop offset="1" stopColor={color} stopOpacity="0.5"/>
        </SvgLinear>
      </Defs>
      <Circle cx={cx} cy={100} r={55+st*9} fill="url(#aura)"/>
      <Path d={`M${cx-p.hW*.5} ${torsoB} Q${cx-p.tq-2} ${kneeY-6} ${cx-p.tq*.6} ${kneeY}`} stroke="url(#sk)" strokeWidth={p.tq*1.6} strokeLinecap="round" fill="none"/>
      <Path d={`M${cx+p.hW*.5} ${torsoB} Q${cx+p.tq+2} ${kneeY-6} ${cx+p.tq*.6} ${kneeY}`} stroke="url(#sk)" strokeWidth={p.tq*1.6} strokeLinecap="round" fill="none"/>
      <Path d={`M${cx-p.hW} ${torsoB} L${cx-p.tq*.8} ${kneeY-8} L${cx+p.tq*.8} ${kneeY-8} L${cx+p.hW} ${torsoB} Z`} fill={dark?'#1E2230':'#5A6080'} opacity={0.9}/>
      <Path d={`M${cx-p.tq*.6} ${kneeY} Q${cx-p.ca-2} ${kneeY+14} ${cx-p.ca*.5} ${legB}`} stroke="url(#sk)" strokeWidth={p.ca*1.7} strokeLinecap="round" fill="none"/>
      <Path d={`M${cx+p.tq*.6} ${kneeY} Q${cx+p.ca+2} ${kneeY+14} ${cx+p.ca*.5} ${legB}`} stroke="url(#sk)" strokeWidth={p.ca*1.7} strokeLinecap="round" fill="none"/>
      <Ellipse cx={cx-p.ca*.5} cy={legB+3} rx={p.ca+3} ry={4} fill={dark?'#111':'#666'}/>
      <Ellipse cx={cx+p.ca*.5} cy={legB+3} rx={p.ca+3} ry={4} fill={dark?'#111':'#666'}/>
      <Path d={`M${cx-p.sW} ${shY} Q${cx-p.wW-2} ${shY+p.tH*.6} ${cx-p.hW*.6} ${torsoB} L${cx+p.hW*.6} ${torsoB} Q${cx+p.wW+2} ${shY+p.tH*.6} ${cx+p.sW} ${shY} Z`} fill="url(#sh)"/>
      <Path d={`M${cx-p.nW} ${shY+2} L${cx} ${shY+10} L${cx+p.nW} ${shY+2}`} stroke={color} strokeWidth={1.5} fill="none" opacity={0.6}/>
      {p.pec&&<><Ellipse cx={cx-p.sW*.38} cy={shY+14} rx={p.ps} ry={p.ps*.75} fill={color} opacity={0.32}/><Ellipse cx={cx+p.sW*.38} cy={shY+14} rx={p.ps} ry={p.ps*.75} fill={color} opacity={0.32}/></>}
      {p.abs&&[0.44,0.61,0.77].map((f,i)=><Line key={i} x1={cx-p.wW*.5} y1={shY+p.tH*f} x2={cx+p.wW*.5} y2={shY+p.tH*f} stroke={color} strokeWidth={0.8} opacity={0.28}/>)}
      {p.abs&&<Line x1={cx} y1={shY+p.tH*.3} x2={cx} y2={torsoB-4} stroke={color} strokeWidth={0.8} opacity={0.22}/>}
      <Path d={`M${lSh+2} ${armT} Q${lSh-6} ${armT+18} ${lSh-2} ${elbowY}`} stroke={skin} strokeWidth={p.uA*1.9} strokeLinecap="round" fill="none"/>
      <Path d={`M${rSh-2} ${armT} Q${rSh+6} ${armT+18} ${rSh+2} ${elbowY}`} stroke={skin} strokeWidth={p.uA*1.9} strokeLinecap="round" fill="none"/>
      <Path d={`M${lSh} ${armT} Q${lSh-4} ${armT+12} ${lSh-1} ${armT+18}`} stroke={color+'CC'} strokeWidth={p.uA*2.1} strokeLinecap="round" fill="none"/>
      <Path d={`M${rSh} ${armT} Q${rSh+4} ${armT+12} ${rSh+1} ${armT+18}`} stroke={color+'CC'} strokeWidth={p.uA*2.1} strokeLinecap="round" fill="none"/>
      {st>=2&&<><Ellipse cx={lSh-4} cy={armT+17} rx={p.uA*.7} ry={p.uA*.5} fill={color} opacity={0.22}/><Ellipse cx={rSh+4} cy={armT+17} rx={p.uA*.7} ry={p.uA*.5} fill={color} opacity={0.22}/></>}
      <Path d={`M${lSh-2} ${elbowY} L${lSh+2} ${wristY}`} stroke={skin} strokeWidth={p.fA*1.9} strokeLinecap="round" fill="none"/>
      <Path d={`M${rSh+2} ${elbowY} L${rSh-2} ${wristY}`} stroke={skin} strokeWidth={p.fA*1.9} strokeLinecap="round" fill="none"/>
      {p.vein&&<><Path d={`M${lSh} ${elbowY+4} Q${lSh-3} ${elbowY+14} ${lSh+1} ${elbowY+22}`} stroke={color} strokeWidth={1} opacity={0.5} fill="none"/><Path d={`M${rSh} ${elbowY+4} Q${rSh+3} ${elbowY+14} ${rSh-1} ${elbowY+22}`} stroke={color} strokeWidth={1} opacity={0.5} fill="none"/></>}
      <Circle cx={lSh+2} cy={wristY+4} r={p.fA*.95} fill={skin}/>
      <Circle cx={rSh-2} cy={wristY+4} r={p.fA*.95} fill={skin}/>
      <Ellipse cx={lSh} cy={shY+1} rx={p.uA*1.15} ry={p.uA*.88} fill={skin}/>
      <Ellipse cx={rSh} cy={shY+1} rx={p.uA*1.15} ry={p.uA*.88} fill={skin}/>
      {st>=3&&<><Ellipse cx={lSh} cy={shY-1} rx={p.uA*.72} ry={p.uA*.55} fill={color} opacity={0.28}/><Ellipse cx={rSh} cy={shY-1} rx={p.uA*.72} ry={p.uA*.55} fill={color} opacity={0.28}/></>}
      {p.trap&&<><Path d={`M${cx-p.nW} ${neckT+4} Q${cx-p.sW*.52} ${shY-3} ${lSh} ${shY+2}`} stroke={skin} strokeWidth={p.uA*.95} strokeLinecap="round" fill="none"/><Path d={`M${cx+p.nW} ${neckT+4} Q${cx+p.sW*.52} ${shY-3} ${rSh} ${shY+2}`} stroke={skin} strokeWidth={p.uA*.95} strokeLinecap="round" fill="none"/></>}
      <Rect x={cx-p.nW*.6} y={neckT} width={p.nW*1.2} height={10} rx={p.nW*.4} fill={skin}/>
      <Circle cx={cx} cy={headY} r={p.hR} fill="url(#sk)"/>
      <Path d={`M${cx-p.hR+2} ${headY-6} Q${cx-p.hR+1} ${headY-p.hR-2} ${cx} ${headY-p.hR-4} Q${cx+p.hR-1} ${headY-p.hR-2} ${cx+p.hR-2} ${headY-6} Z`} fill={dark?'#2A2016':'#5A3C28'}/>
      <Circle cx={cx-5} cy={headY-2} r={2.2} fill={dark?'#1A1A2E':'#3A3530'}/>
      <Circle cx={cx+5} cy={headY-2} r={2.2} fill={dark?'#1A1A2E':'#3A3530'}/>
      <Circle cx={cx-4} cy={headY-3} r={0.7} fill="white" opacity={0.7}/>
      <Circle cx={cx+6} cy={headY-3} r={0.7} fill="white" opacity={0.7}/>
      {st<=1?<Path d={`M${cx-4} ${headY+5} Q${cx} ${headY+8} ${cx+4} ${headY+5}`} stroke={skinD} strokeWidth={1.2} fill="none" strokeLinecap="round"/>:<Line x1={cx-4} y1={headY+6} x2={cx+4} y2={headY+6} stroke={skinD} strokeWidth={1.4} strokeLinecap="round"/>}
      {st===5&&<><Path d={`M${cx-10} ${headY-p.hR-2} L${cx-6} ${headY-p.hR-8} L${cx} ${headY-p.hR-5} L${cx+6} ${headY-p.hR-8} L${cx+10} ${headY-p.hR-2} Z`} fill="#FFD700" stroke="#FF8C00" strokeWidth={0.8}/><Circle cx={cx-6} cy={headY-p.hR-8} r={2} fill={color}/><Circle cx={cx} cy={headY-p.hR-5} r={2.5} fill={color}/><Circle cx={cx+6} cy={headY-p.hR-8} r={2} fill={color}/></>}
    </Svg>
  );
};

export const AthleteAvatar: React.FC<Props> = ({ tier, xp, totalWorkouts, streak }) => {
  const theme = useTheme();
  const level = Math.max(1, Math.min(30, tier));
  const rank = RANK_DATA[level - 1];
  const { pct, xpInLevel, xpNeeded } = getLevelProgress(xp);
  const stage = getBodyStage(level);
  const stageLabel = ['Principiante','En forma','Atlético','Musculado','Poderoso','Bestia'][stage];

  return (
    <View style={{ backgroundColor:theme.bgCard, borderRadius:Radius.xl, borderWidth:1, borderColor:rank.color+'40', padding:Spacing.lg, alignItems:'center', overflow:'hidden', marginBottom:Spacing.md }}>
      <View style={{ position:'absolute', top:-40, width:260, height:260, borderRadius:130, backgroundColor:rank.color+Math.round((0.04+stage*0.025)*255).toString(16).padStart(2,'0') }}/>

      {/* Header: level left, SECRET emoji right */}
      <View style={{ flexDirection:'row', width:'100%', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <View style={{ backgroundColor:theme.bgElevated, borderRadius:Radius.sm, paddingHorizontal:10, paddingVertical:5, borderWidth:1, borderColor:theme.border }}>
          <Text style={{ color:theme.textMuted, fontSize:9, fontWeight:'700', letterSpacing:1 }}>NIVEL</Text>
          <Text style={{ color:rank.color, fontSize:22, fontWeight:'900', lineHeight:24 }}>{level}</Text>
        </View>
        {/* Emoji grande — rango secreto, sin nombre */}
        <View style={{ width:68, height:68, borderRadius:34, backgroundColor:rank.color+'1A', borderWidth:2, borderColor:rank.color+'50', alignItems:'center', justifyContent:'center', shadowColor:rank.color, shadowOffset:{width:0,height:0}, shadowOpacity:0.55, shadowRadius:14, elevation:10 }}>
          <Text style={{ fontSize:38 }}>{rank.emoji}</Text>
        </View>
      </View>

      {/* Evolving figure */}
      <Fig level={level} color={rank.color} dark={theme.mode==='dark'}/>

      {/* Stage badge */}
      <View style={{ backgroundColor:rank.color+'22', borderRadius:Radius.full, paddingHorizontal:12, paddingVertical:4, borderWidth:1, borderColor:rank.color+'45', marginTop:-4 }}>
        <Text style={{ color:rank.color, fontSize:11, fontWeight:'800' }}>{stageLabel} · Etapa {stage+1}/6</Text>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection:'row', width:'100%', marginTop:14, backgroundColor:theme.bgElevated, borderRadius:Radius.md, borderWidth:1, borderColor:theme.border, overflow:'hidden' }}>
        {[
          { val:totalWorkouts.toString(), lbl:'ENTRENOS', col:rank.color },
          { val:streak>0?`🔥${streak}`:'0', lbl:'RACHA', col:streak>0?'#FF6B35':theme.textMuted },
          { val:xp>=1000?`${(xp/1000).toFixed(1)}k`:xp.toString(), lbl:'XP', col:theme.secondary },
        ].map(({val,lbl,col},i)=>(
          <View key={lbl} style={{ flex:1, alignItems:'center', paddingVertical:10, borderRightWidth:i<2?1:0, borderRightColor:theme.border }}>
            <Text style={{ color:col, fontSize:18, fontWeight:'900' }}>{val}</Text>
            <Text style={{ color:theme.textMuted, fontSize:9, fontWeight:'700', letterSpacing:0.8, marginTop:2 }}>{lbl}</Text>
          </View>
        ))}
      </View>

      {/* XP bar — next level is ??? */}
      <View style={{ width:'100%', marginTop:14 }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:5 }}>
          <Text style={{ color:theme.textMuted, fontSize:10, fontWeight:'700' }}>
            {level<30?`${xpInLevel.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`:'NIVEL MÁXIMO 🔱'}
          </Text>
          {level<30&&<Text style={{ color:theme.textMuted, fontSize:10 }}>Siguiente: <Text style={{ color:rank.color+'99', fontWeight:'700' }}>???</Text></Text>}
        </View>
        <View style={{ height:10, backgroundColor:theme.bgSunken, borderRadius:5, overflow:'hidden', borderWidth:1, borderColor:theme.border }}>
          <LinearGradient colors={[rank.color+'AA',rank.color]} start={{x:0,y:0}} end={{x:1,y:0}}
            style={{ width:`${Math.max(3,pct*100)}%` as any, height:10, borderRadius:5 }}/>
        </View>
        {level<30&&<Text style={{ color:theme.textMuted, fontSize:9, textAlign:'right', marginTop:3 }}>{Math.round(pct*100)}%</Text>}
      </View>
    </View>
  );
};
