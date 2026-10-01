const U=process.env.SUPABASE_URL,K=process.env.SUPABASE_SECRET_KEY;
export default async function h(req,res){
 if(req.method!=="POST")return res.status(405).end();
 try{
  const b=req.body||{};
  const r=await fetch(U+"/rest/v1/cleaning_leads",{method:"POST",headers:{apikey:K,Authorization:"Bearer "+K,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify({
   service_type:b.type,name:b.name,phone:b.phone,email:b.email||null,address:b.address,
   bedrooms:b.beds||null,bathrooms:b.baths||null,sq_ft:b.type==="home"?(b.size||null):(b.officeSize||null),
   cleaning_type:b.clean||null,frequency:b.type==="home"?b.freq:b.officeFreq,quoted_price:b.price,status:"new",
   condition_level:b.type==="home"?b.condition:null,addons:b.type==="home"?(b.addons||[]).map(function(id){return id==="cabinets"&&b.cabinetSize?"cabinets_"+b.cabinetSize:id}):[],
   facility_type:b.type==="office"?b.facility:null,restrooms:b.type==="office"?b.restrooms:null,occupants:b.type==="office"?b.occupants:null
  })});
  if(!r.ok){const detail=await r.text();console.error("Supabase lead save failed",r.status,detail);return res.status(500).json({error:"save failed",status:r.status,detail})}return res.status(200).json({ok:true})
 }catch(e){console.error(e);return res.status(500).json({error:"save failed"})}
}