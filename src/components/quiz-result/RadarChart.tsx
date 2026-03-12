import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from "recharts";
import { dimensionLabels, type SixDimensions } from "@/lib/quizResultUtils";
import { motion } from "framer-motion";

interface RadarChartProps {
  current: SixDimensions;
  potential: SixDimensions;
}

const RadarChartComponent = ({ current, potential }: RadarChartProps) => {
  const data = (Object.keys(current) as (keyof SixDimensions)[]).map((key) => ({
    dimension: dimensionLabels[key],
    Atual: current[key],
    "Em 12 Semanas": potential[key],
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={300}>
        <RechartsRadar data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "'Inter', sans-serif" }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 10]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Atual"
            dataKey="Atual"
            stroke="#EF4444"
            fill="#EF4444"
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Radar
            name="Em 12 Semanas"
            dataKey="Em 12 Semanas"
            stroke="#10B981"
            fill="#10B981"
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default RadarChartComponent;
