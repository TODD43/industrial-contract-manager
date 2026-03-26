import { useState } from "react";
import { useGetExpiryCalendar } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, Badge } from "@/components/ui-library";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { Link } from "wouter";

export default function ExpiryCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // API expects 1-12
  
  const { data: calendarData, isLoading } = useGetExpiryCalendar({ query: { year, month } });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl text-foreground text-glow">Expiry Matrix</h1>
          <p className="text-muted-foreground font-mono mt-1">Chronological mapping of critical termination vectors.</p>
        </div>
        <div className="flex items-center space-x-4 bg-card border border-border rounded-sm p-1">
          <button onClick={prevMonth} className="p-2 hover:bg-secondary rounded-sm text-primary transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-display font-bold uppercase tracking-widest text-lg w-40 text-center">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-secondary rounded-sm text-primary transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col p-0 overflow-hidden hud-border">
        <div className="grid grid-cols-7 border-b border-border bg-secondary/50">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="p-3 text-center font-display font-bold text-xs tracking-widest text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center font-mono text-primary animate-pulse">Rendering Matrix...</div>
        ) : (
          <div className="flex-1 grid grid-cols-7 auto-rows-fr">
            {/* Empty slots for start of month alignment */}
            {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="border-r border-b border-border/30 bg-background/50 p-2" />
            ))}
            
            {/* Days */}
            {daysInMonth.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const entry = calendarData?.find(d => d.date.startsWith(dateStr));
              const contracts = entry?.contracts || [];
              const isToday = isSameDay(day, new Date());
              
              return (
                <div 
                  key={dateStr} 
                  className={`border-r border-b border-border/50 p-2 min-h-[120px] transition-colors hover:bg-secondary/20 ${isToday ? 'bg-primary/5 ring-1 ring-inset ring-primary' : ''}`}
                >
                  <div className={`text-right font-mono text-sm mb-2 ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                    {contracts.map(c => (
                      <Link key={c.id} href={`/contracts/${c.id}`}>
                        <div className={`text-[10px] p-1 rounded-sm cursor-pointer truncate font-mono border-l-2
                          ${c.riskLevel === 'high' ? 'bg-destructive/10 border-destructive text-destructive-foreground hover:bg-destructive/20' : 
                            c.riskLevel === 'medium' ? 'bg-warning/10 border-warning text-warning-foreground hover:bg-warning/20' : 
                            'bg-success/10 border-success text-success-foreground hover:bg-success/20'}
                        `}>
                          {c.title}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
