const U=process.env.SUPABASE_URL,K=process.env.SUPABASE_SECRET_KEY;
export default async function h(req,res){
 if(req.method!=="POST")return res.status(405).end();
 try{
  if(!U||!K)return res.status(500).json({error:"server configuration missing",missing_url:!U,missing_key:!K});
  const b=req.body||{};
  if(b.type==="home"&&(!b.appointmentDate||!b.appointmentTime))return res.status(400).json({error:"appointment required"});
  if(b.type==="home"){
   const q=U+"/rest/v1/cleaning_leads?service_type=eq.home&appointment_date=eq."+encodeURIComponent(b.appointmentDate)+"&appointment_time=eq."+encodeURIComponent(b.appointmentTime)+"&status=neq.cancelled&select=id";
   const ck=await fetch(q,{headers:{apikey:K,Authorization:"Bearer "+K}});
   if(!ck.ok)return res.status(500).json({error:"availability check failed"});
   if((await ck.json()).length)return res.status(409).json({error:"That appointment was just booked. Please choose another time."});
  }
  const payload={
   service_type:b.type,name:b.name,phone:b.phone,email:b.email||null,address:b.address,
   bedrooms:b.beds||null,bathrooms:b.baths||null,sq_ft:b.type==="home"?(b.size||null):(b.officeSize||null),
   cleaning_type:b.clean||null,frequency:b.type==="home"?b.freq:b.officeFreq,quoted_price:b.price,recurring_price:b.type==="home"&&b.freq!=="once"?Math.round(Number(b.price)*(1-({monthly:.10,biweekly:.15,weekly:.20}[b.freq]||0))):null,status:b.type==="home"?"booked":"new",
   condition_level:b.type==="home"?b.condition:null,addons:b.type==="home"?(b.addons||[]).map(id=>id==="cabinets"&&b.cabinetSize?"cabinets_"+b.cabinetSize:id):[],
   facility_type:b.type==="office"?b.facility:null,restrooms:b.type==="office"?b.restrooms:null,occupants:b.type==="office"?b.occupants:null,
   appointment_date:b.type==="home"?b.appointmentDate:null,appointment_time:b.type==="home"?b.appointmentTime:null
  };
  const r=await fetch(U+"/rest/v1/cleaning_leads",{method:"POST",headers:{apikey:K,Authorization:"Bearer "+K,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify(payload)});
  if(!r.ok){const detail=await r.text();if(r.status===409||detail.includes("cleaning_home_appointment_slot_unique"))return res.status(409).json({error:"That appointment was just booked. Please choose another time."});console.error("Supabase lead save failed",r.status,detail);return res.status(500).json({error:"save failed",status:r.status,detail})}
  const saved=await r.json();
  return res.status(200).json({ok:true,lead:saved[0]});
 }catch(e){console.error(e);return res.status(500).json({error:"save failed"})}
}