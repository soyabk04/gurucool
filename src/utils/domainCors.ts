import { connection } from "../config/redis.config.js";

export async function getDomainsRedis(allowedDomains:string[]){
     let allDomains =await connection.get('allowedDomains');
     if(!allDomains){
      await connection.set('allowedDomains', JSON.stringify(allowedDomains));
     };
     allDomains=await connection.get('allowedDomains');
     if (!allDomains) {
       throw new Error('Unable to retrieve allowed domains from Redis');
     };
     return JSON.parse(allDomains);
}

export async function addDomainToAllowedDomain(domain:string){
    let allDomains=await connection.get('allowedDomains');
    if (!allDomains) {
      throw new Error('Unable to retrieve allowed domains from Redis');
    }
    const domains: string[] = JSON.parse(allDomains);
    domains.push(domain);
    await connection.set('allowedDomains', JSON.stringify(domains));
}