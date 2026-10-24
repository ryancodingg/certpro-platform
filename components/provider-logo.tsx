import { Github, Cloud } from "lucide-react"
const MicrosoftLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 0h11v11H0V0z" fill="#00a4ef" />
    <path d="M12 0h11v11H12V0z" fill="#7fba00" />
    <path d="M0 12h11v11H0V12z" fill="#f25022" />
    <path d="M12 12h11v11H12V12z" fill="#ffb900" />
  </svg>
)

const AmazonLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M.045 18.02c.072-.116.187-.18.315-.18.061 0 .127.019.2.056 2.875 1.621 6.045 2.432 9.51 2.432 2.302 0 4.635-.44 6.998-1.319 2.364-.88 4.4-2.146 6.11-3.799.128-.116.26-.174.395-.174.134 0 .248.058.34.174.094.116.14.245.14.387 0 .116-.023.221-.07.315-.047.094-.117.18-.21.26-1.804 1.748-3.96 3.108-6.47 4.08-2.51.972-5.074 1.458-7.692 1.458-3.77 0-7.31-.818-10.62-2.454-.116-.07-.198-.154-.245-.252-.047-.098-.07-.2-.07-.305 0-.142.046-.271.14-.387l-.001-.002z"
      fill="#FF9900"
    />
    <path
      d="M20.954 14.85c-.234 0-.47.058-.708.174-1.804.93-3.747 1.395-5.829 1.395-1.944 0-3.817-.41-5.62-1.23-1.804-.82-3.305-1.963-4.504-3.428-.047-.07-.07-.151-.07-.245 0-.117.035-.221.105-.315.07-.094.164-.14.28-.14.094 0 .181.035.26.105 1.106 1.27 2.443 2.27 4.013 3.001 1.57.73 3.234 1.095 4.992 1.095 1.758 0 3.446-.365 5.064-1.095 1.618-.73 2.955-1.73 4.013-3.001.07-.07.157-.105.26-.105.117 0 .21.046.28.14.07.094.105.198.105.315 0 .094-.023.175-.07.245-1.199 1.465-2.7 2.608-4.504 3.428-.234.116-.47.174-.708.174l.041-.014z"
      fill="#FF9900"
    />
  </svg>
)

const DatabricksLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#FF3621" />
    <path d="M7 9l5-3 5 3v6l-5 3-5-3V9z" fill="white" />
    <path d="M12 6l3 1.8v3.6L12 13l-3-1.6V7.8L12 6z" fill="#FF3621" />
  </svg>
)

const CiscoLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="8" width="2" height="8" rx="1" fill="#00bceb" />
    <rect x="6" y="6" width="2" height="12" rx="1" fill="#00bceb" />
    <rect x="10" y="4" width="2" height="16" rx="1" fill="#00bceb" />
    <rect x="14" y="6" width="2" height="12" rx="1" fill="#00bceb" />
    <rect x="18" y="8" width="2" height="8" rx="1" fill="#00bceb" />
  </svg>
)


export function ProviderLogo({provider,className="h-9 w-9"}:{provider:string;className?:string}) { if (["CompTIA", "ISC2", "ISACA"].includes(provider)) return <span className="inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs font-bold text-red-700" aria-label={provider}>{provider}</span>; const Logo=provider==="Microsoft"?MicrosoftLogo:provider==="AWS"?AmazonLogo:provider==="Databricks"?DatabricksLogo:provider==="GitHub"?Github:provider==="Cisco"?CiscoLogo:Cloud; return <span role="img" aria-label={provider+" logo"}><Logo className={className}/></span> }