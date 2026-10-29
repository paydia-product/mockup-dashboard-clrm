import type { ComponentType } from 'react'
import Aph from './Aph'
import Fraud from './Fraud'
import Kajian from './Kajian'
import Kontrak from './Kontrak'
import LayananHukum from './LayananHukum'
import Perizinan from './Perizinan'
import RegChange from './RegChange'
import Reporting from './Reporting'
import RiskRegister from './RiskRegister'
import Sop from './Sop'

// route -> halaman berbasis kit (tracker dan halaman shared dirender langsung oleh App)
export const PAGES: Record<string, ComponentType> = {
  'compliance/regulatory-reporting': Reporting,
  'compliance/regulatory-change': RegChange,
  'compliance/sop-dokumen-kontrol': Sop,
  'risk/risk-register': RiskRegister,
  'risk/kajian-risiko': Kajian,
  'fraud/fraud-case-monitoring': Fraud,
  'legal/kontrak': Kontrak,
  'legal/permintaan-aph': Aph,
  'legal/perizinan': Perizinan,
  'legal/layanan-hukum': LayananHukum,
}
