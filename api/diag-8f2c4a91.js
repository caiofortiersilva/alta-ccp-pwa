const nodemailer=require('nodemailer');
module.exports=async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  const cfg={
    APP_KEY:!!process.env.APP_KEY,
    PERSONAL_EMAIL:!!process.env.PERSONAL_EMAIL,
    SERVICE_EMAIL:!!process.env.SERVICE_EMAIL,
    SMTP_HOST:!!process.env.SMTP_HOST,
    SMTP_PORT:!!process.env.SMTP_PORT,
    SMTP_USER:!!process.env.SMTP_USER,
    SMTP_PASS:!!process.env.SMTP_PASS,
    SMTP_FROM:!!process.env.SMTP_FROM
  };
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método não permitido'});
  const missing=Object.entries(cfg).filter(([k,v])=>!v && !['SERVICE_EMAIL'].includes(k)).map(([k])=>k);
  if(missing.length) return res.status(200).json({ok:false,stage:'env',config:cfg,missing});
  const port=Number(process.env.SMTP_PORT||587);
  const tx=nodemailer.createTransport({host:process.env.SMTP_HOST,port,secure:port===465,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS},connectionTimeout:15000,greetingTimeout:15000,socketTimeout:30000});
  try{
    await tx.verify();
    return res.status(200).json({ok:true,stage:'smtp_verify',config:cfg,secure:port===465,port});
  }catch(e){
    return res.status(200).json({ok:false,stage:'smtp_verify',config:cfg,code:e&&e.code?String(e.code):null,command:e&&e.command?String(e.command):null,responseCode:e&&e.responseCode?e.responseCode:null,message:e&&e.message?String(e.message).replace(process.env.SMTP_PASS||'','[redacted]').slice(0,220):'SMTP verification failed'});
  }
};
