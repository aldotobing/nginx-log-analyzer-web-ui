import { RequestStats } from "./RequestStats";
import { HttpMethodsChart } from "./HttpMethodsChart";
import { StatusCodesChart } from "./StatusCodesChart";
import { AttackDistributionChart } from "./AttackDistributionChart";
import { TrafficOverTimeChart } from "./TrafficOverTimeChart";
import { RecentAttacksTable } from "./RecentAttacksTable";

interface LogData {
  requestStats?: any;
  httpMethods?: any;
  statusCodes?: any;
  attackDistribution?: any;
  trafficOverTime?: any[];
  recentAttacks?: any[];
}

export function Dashboard({ logData = {} as LogData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div className="md:col-span-2 xl:col-span-3">
        <RequestStats data={logData.requestStats} />
      </div>
      <div className="md:col-span-1">
        <HttpMethodsChart data={logData.httpMethods || {}} />
      </div>
      <div className="md:col-span-1">
        <StatusCodesChart data={logData.statusCodes || {}} />
      </div>
      <div className="md:col-span-2 xl:col-span-1">
        <AttackDistributionChart data={logData.attackDistribution || {}} />
      </div>
      <div className="md:col-span-2 xl:col-span-3">
        <TrafficOverTimeChart data={logData.trafficOverTime || []} />
      </div>
      <div className="md:col-span-2 xl:col-span-3">
        <RecentAttacksTable data={logData.recentAttacks || []} />
      </div>
    </div>
  );
}
