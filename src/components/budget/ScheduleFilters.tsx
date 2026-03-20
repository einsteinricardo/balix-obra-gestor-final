
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

interface ScheduleFiltersProps {
  startDate: Date;
  endDate: Date;
  onUpdatePeriod: (start: Date, end: Date) => void;
}

const ScheduleFilters: React.FC<ScheduleFiltersProps> = ({
  startDate,
  endDate,
  onUpdatePeriod
}) => {
  const [tempStartDate, setTempStartDate] = useState(format(startDate, 'yyyy-MM-dd'));
  const [tempEndDate, setTempEndDate] = useState(format(endDate, 'yyyy-MM-dd'));

  const handleUpdatePeriod = () => {
    const start = new Date(tempStartDate);
    const end = new Date(tempEndDate);
    
    if (start <= end) {
      onUpdatePeriod(start, end);
    }
  };

  return (
    <Card className="bg-[#1e2914] border-[#2f3b24] p-4">
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="startDate" className="text-[#8b4a12] flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Data Inicial
          </Label>
          <Input
            id="startDate"
            type="date"
            value={tempStartDate}
            onChange={(e) => setTempStartDate(e.target.value)}
            className="bg-[#262d1f] border-[#7b420e] text-white"
          />
        </div>

        <div className="flex-1">
          <Label htmlFor="endDate" className="text-[#8b4a12] flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Data Final
          </Label>
          <Input
            id="endDate"
            type="date"
            value={tempEndDate}
            onChange={(e) => setTempEndDate(e.target.value)}
            className="bg-[#262d1f] border-[#7b420e] text-white"
          />
        </div>

        <Button
          onClick={handleUpdatePeriod}
          className="bg-[#dda23a] hover:bg-[#e8b949] text-[#151f0e]"
        >
          Atualizar Cronograma
        </Button>
      </div>
    </Card>
  );
};

export default ScheduleFilters;
