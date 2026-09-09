import { connection } from "../config/redis.config.js";
import { getDomains } from "../services/organization.service.js";

export async function seedAllowedDomains(): Promise<void> {
  try {
    const result = await getDomains(); // { success, message, data }

    const domains = (result.data ?? [])
      .filter(Boolean)
      .map((d: string) => d.toLowerCase().trim());

    await connection.del("allowedDomains");

    if (domains.length === 0) {
      console.error(
        "[CORS] seedAllowedDomains: 0 organization domains found. " +
        "Every cross-origin request will be rejected until this is fixed."
      );
      return;
    }

    await connection.sadd("allowedDomains", ...domains);
    console.log(`[CORS] seedAllowedDomains: loaded ${domains.length} domain(s) into Redis.`);
  } catch (err) {
    console.error("[CORS] seedAllowedDomains failed:", err);
  }
}
export async function getAllowedDomains(){
    const domains=await connection.smembers('allowedDomains');
    if(!domains){
        throw new Error('Unable to retrieve allowed domains from Redis');
    }
    
    return domains
}

export async function addDomainToAllowedDomain(domain:string){
    let allDomains=await connection.smembers('allowedDomains');
    if (!allDomains) {
      throw new Error('Unable to retrieve allowed domains from Redis');
    }
    
    allDomains.push(domain);
    await connection.sadd('allowedDomains', allDomains);
}

export async function deleteDomainFromAllowedDomain(domain:string){
        let allDomains=await connection.smembers('allowedDomains');
    if (!allDomains) {
      throw new Error('Unable to retrieve allowed domains from Redis');
    }

    const domainIndex = allDomains.indexOf(domain);
    if (domainIndex !== -1) {
      allDomains.splice(domainIndex, 1);
    }
    await connection.sadd('allowedDomains', allDomains);
}