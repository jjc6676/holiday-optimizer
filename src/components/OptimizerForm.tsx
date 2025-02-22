'use client';

import { FormEvent, KeyboardEvent, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CustomDayOff, OptimizationStrategy } from '@/types';
import { format, parse } from 'date-fns';
import {
  Calendar,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Palmtree,
  Plus,
  Shuffle,
  Sparkles,
  Star,
  Sunrise,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOptimizer } from '@/contexts/OptimizerContext';
import { OPTIMIZATION_STRATEGIES } from '@/constants';
import { MonthCalendarSelector } from './features/components/MonthCalendarSelector';
import { getStoredHolidays } from '@/lib/storage/holidays';

const WEEKDAYS = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '0', label: 'Sunday' },
] as const;

interface OptimizerFormProps {
  onSubmit: (data: {
    days: number
    strategy: OptimizationStrategy
    customDaysOff: CustomDayOff[]
    holidays: Array<{ date: string, name: string }>
  }) => void;
  isLoading?: boolean;
}

type CustomDayField = keyof Partial<CustomDayOff>

// Update the icons type to match strategy IDs
const STRATEGY_ICONS: Record<OptimizationStrategy, typeof Shuffle> = {
  balanced: Shuffle,
  miniBreaks: Star,
  longWeekends: Coffee,
  weekLongBreaks: Sunrise,
  extendedVacations: Palmtree,
};

export function OptimizerForm({ onSubmit, isLoading = false }: OptimizerFormProps) {
  const { state, dispatch } = useOptimizer();
  const {
    days,
    strategy,
    errors,
    customDaysOff,
    isAdding,
    newCustomDay,
    holidays,
    selectedDates,
    currentMonth,
    currentYear,
    isAddingHoliday,
    newHoliday,
  } = state;

  // Load stored holidays on mount
  useEffect(() => {
    const storedHolidays = getStoredHolidays();
    storedHolidays.forEach(date => {
      dispatch({
        type: 'ADD_HOLIDAY',
        payload: {
          date: format(date, 'yyyy-MM-dd'),
          name: format(date, 'MMMM d, yyyy')
        }
      });
    });
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const numDays = parseInt(days);

    if (numDays > 0) {
      onSubmit({
        days: numDays,
        strategy,
        customDaysOff,
        holidays,
      });
    } else {
      return;
    }
  };

  const handleCustomDayAdd = () => {
    if (!newCustomDay.name) {
      return;
    }

    // Ensure all required fields are present based on type
    if (newCustomDay.isRecurring && (!newCustomDay.startDate || !newCustomDay.endDate || newCustomDay.weekday === undefined)) {
      return;
    }

    if (!newCustomDay.isRecurring && !newCustomDay.date) {
      return;
    }

    dispatch({ type: 'ADD_CUSTOM_DAY', payload: newCustomDay as CustomDayOff });


    // Reset form and close it
    dispatch({ type: 'RESET_NEW_CUSTOM_DAY' });
    dispatch({ type: 'SET_IS_ADDING', payload: false });
  };

  const handleCustomDayRemove = (index: number) => {
    dispatch({ type: 'REMOVE_CUSTOM_DAY', payload: index });
  };

  const handleCustomDayUpdate = (field: CustomDayField, value: unknown) => {
    dispatch({ type: 'UPDATE_NEW_CUSTOM_DAY', payload: { [field]: value } });
  };

  const handleHolidayAdd = () => {
    if (!newHoliday.name || !newHoliday.date) {
      return;
    }

    dispatch({ type: 'ADD_HOLIDAY', payload: newHoliday });
    dispatch({ type: 'RESET_NEW_HOLIDAY' });
    dispatch({ type: 'SET_IS_ADDING_HOLIDAY', payload: false });
  };

  const handleHolidayRemove = (index: number) => {
    dispatch({ type: 'REMOVE_HOLIDAY', payload: index });
  };

  const handleHolidayUpdate = (field: 'name' | 'date', value: string) => {
    dispatch({ type: 'UPDATE_NEW_HOLIDAY', payload: { [field]: value } });
  };

  const handleStrategyKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = OPTIMIZATION_STRATEGIES.findIndex(s => s.id === strategy);
    const lastIndex = OPTIMIZATION_STRATEGIES.length - 1;

    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowLeft': {
        e.preventDefault();
        const prevIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
        const prevStrategy = OPTIMIZATION_STRATEGIES[prevIndex];
        dispatch({ type: 'SET_STRATEGY', payload: prevStrategy.id });
        const radioInput = document.querySelector<HTMLInputElement>(`input[value="${prevStrategy.id}"]`);
        radioInput?.focus();
        break;
      }
      case 'ArrowDown':
      case 'ArrowRight': {
        e.preventDefault();
        const nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
        const nextStrategy = OPTIMIZATION_STRATEGIES[nextIndex];
        dispatch({ type: 'SET_STRATEGY', payload: nextStrategy.id });
        const radioInput = document.querySelector<HTMLInputElement>(`input[value="${nextStrategy.id}"]`);
        radioInput?.focus();
        break;
      }
    }
  };

  const handleWeekdayKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (e.key) {
      case 'ArrowLeft': {
        e.preventDefault();
        const prevIndex = index === 0 ? WEEKDAYS.length - 1 : index - 1;
        handleCustomDayUpdate('weekday', parseInt(WEEKDAYS[prevIndex].value));
        const weekdayButton = document.querySelector<HTMLButtonElement>(`[data-weekday-index="${prevIndex}"]`);
        weekdayButton?.focus();
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        const nextIndex = (index + 1) % WEEKDAYS.length;
        handleCustomDayUpdate('weekday', parseInt(WEEKDAYS[nextIndex].value));
        const weekdayButton = document.querySelector<HTMLButtonElement>(`[data-weekday-index="${nextIndex}"]`);
        weekdayButton?.focus();
        break;
      }
    }
  };

  const handleCustomDaysKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      dispatch({ type: 'SET_IS_ADDING', payload: true });
    }
  };

  const handleDateSelect = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const isSelected = selectedDates.some(d => 
      format(d, 'yyyy-MM-dd') === formattedDate
    );

    if (isSelected) {
      dispatch({ 
        type: 'REMOVE_HOLIDAY', 
        payload: holidays.findIndex(h => h.date === formattedDate)
      });
    } else {
      dispatch({
        type: 'ADD_HOLIDAY',
        payload: {
          date: formattedDate,
          name: format(date, 'MMMM d, yyyy')
        }
      });
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      dispatch({ type: 'SET_MONTH', payload: 11 });
      dispatch({ type: 'SET_YEAR', payload: currentYear - 1 });
    } else {
      dispatch({ type: 'SET_MONTH', payload: currentMonth - 1 });
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      dispatch({ type: 'SET_MONTH', payload: 0 });
      dispatch({ type: 'SET_YEAR', payload: currentYear + 1 });
    } else {
      dispatch({ type: 'SET_MONTH', payload: currentMonth + 1 });
    }
  };

  return (
    <main
      className="bg-teal-50/30 dark:bg-gray-800/60 rounded-lg p-3 ring-1 ring-teal-900/5 dark:ring-teal-300/10 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4" aria-label="Time off optimizer">
        <div className="space-y-3">
          <header>
            <h1 className="text-base font-semibold text-teal-900 dark:text-teal-100 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-300" aria-hidden="true" />
              Optimize Your Time Off
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              Configure your preferences to get the most out of your CTO days.
            </p>
          </header>

          <div className="space-y-3">
            {/* Days Input Section */}
            <section
              className="bg-white/90 dark:bg-gray-800/60 rounded-lg p-2.5 ring-1 ring-teal-900/5 dark:ring-teal-300/10 space-y-2"
              aria-labelledby="days-heading"
            >
              <header>
                <h2 id="days-heading" className="text-xs font-medium text-teal-900 dark:text-teal-100">
                  How many CTO days do you have?
                </h2>
                <p id="days-description" className="text-[10px] text-gray-600 dark:text-gray-300 mt-0.5">
                  Enter the number of CTO days you have available.
                </p>
              </header>
              <div>
                <label htmlFor="days" className="sr-only">Enter number of CTO days available (numeric input field)</label>
                <Input
                  autoFocus
                  id="days"
                  name="days"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={3}
                  min={1}
                  max={365}
                  value={days}
                  onChange={(e) => {
                    dispatch({ type: 'SET_DAYS', payload: e.target.value });
                  }}
                  className={cn(
                    'max-w-[160px] h-8 bg-white dark:bg-gray-900 border-teal-200 dark:border-teal-800 focus:border-teal-400 dark:focus:border-teal-600 text-sm text-teal-900 dark:text-teal-100',
                    errors.days && 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500',
                  )}
                  required
                  aria-describedby="days-description days-error"
                  aria-invalid={!!errors.days}
                  aria-errormessage={errors.days ? 'days-error' : undefined}
                />
                {errors.days && (
                  <p id="days-error" role="alert" className="text-[10px] text-red-500 dark:text-red-400 mt-1">
                    {errors.days}
                  </p>
                )}
              </div>
            </section>

            {/* Strategy Selection Section */}
            <section
              className="bg-white/90 dark:bg-gray-800/60 rounded-lg p-2.5 ring-1 ring-blue-900/5 dark:ring-blue-300/10 space-y-2"
              aria-labelledby="strategy-heading"
            >
              <header>
                <h2 id="strategy-heading" className="text-xs font-medium text-blue-900 dark:text-blue-100">
                  How would you like to optimize your time off?
                </h2>
                <p id="strategy-description" className="text-[10px] text-gray-600 dark:text-gray-300 mt-0.5">
                  Choose a strategy that matches your preferred vacation style.
                </p>
              </header>
              <div
                role="radiogroup"
                aria-labelledby="strategy-heading"
                aria-describedby="strategy-description"
                className="space-y-1.5"
                onKeyDown={handleStrategyKeyDown}
              >
                {OPTIMIZATION_STRATEGIES.map((strategyOption, index) => {
                  const Icon = STRATEGY_ICONS[strategyOption.id];
                  const isSelected = strategy === strategyOption.id;

                  return (
                    <label
                      key={strategyOption.id}
                      className={cn(
                        'flex items-center p-2 rounded-lg transition-all duration-200 cursor-pointer',
                        'focus-within:ring-2 focus-within:ring-blue-400 dark:focus-within:ring-blue-600',
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-900/30 ring-1 ring-blue-900/10 dark:ring-blue-400/10'
                          : 'bg-white dark:bg-gray-800/60 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-blue-200 dark:hover:ring-blue-800',
                      )}
                    >
                      <input
                        type="radio"
                        name="strategy"
                        value={strategyOption.id}
                        checked={isSelected}
                        className="sr-only"
                        tabIndex={isSelected || (index === 0 && !strategy) ? 0 : -1}
                        onChange={() => dispatch({ type: 'SET_STRATEGY', payload: strategyOption.id })}
                      />
                      <div className="flex items-center gap-2 w-full">
                        <div className={cn(
                          'p-1.5 rounded-md',
                          isSelected
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
                        )}>
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                            {strategyOption.label}
                            {strategyOption.id === 'balanced' && (
                              <span
                                className="ml-1.5 inline-flex items-center rounded-md bg-blue-50/80 dark:bg-blue-900/30 px-1.5 py-0.5 text-[10px] font-medium text-blue-900 dark:text-blue-100 ring-1 ring-blue-900/10 dark:ring-blue-400/10">
                                Recommended
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-gray-600 dark:text-gray-300">
                            {strategyOption.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-300 flex-shrink-0" />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* Custom Days Off Section */}
            <section
              className="bg-white/90 dark:bg-gray-800/60 rounded-lg p-2.5 ring-1 ring-violet-900/5 dark:ring-violet-300/10"
              aria-labelledby="custom-days-heading"
            >
              <header className="mb-2">
                <h2 id="custom-days-heading" className="text-xs font-medium text-violet-900 dark:text-violet-100">
                  Add custom days off
                </h2>
                <p className="text-[10px] text-gray-600 dark:text-gray-300 mt-0.5">
                  Include company holidays or other regular days off.
                </p>
              </header>
              <div className="space-y-4">
                {/* Existing Custom Days List */}
                {customDaysOff.length > 0 && (
                  <ul className="grid gap-2" aria-label="Added custom days off">
                    {customDaysOff.map((day, index) => (
                      <li
                        key={index}
                        className="group relative flex items-center justify-between p-2.5 bg-white dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          {day.isRecurring ? (
                            <div
                              className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                              <CalendarDays className="h-4 w-4 text-violet-600 dark:text-violet-400"
                                            aria-hidden="true" />
                            </div>
                          ) : (
                            <div
                              className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{day.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {day.isRecurring
                                ? `${WEEKDAYS.find(w => w.value === day.weekday?.toString())?.label}s from ${format(parse(day.startDate!, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')} to ${format(parse(day.endDate!, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')}`
                                : format(parse(day.date, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCustomDayRemove(index)}
                          className="opacity-0 group-hover:opacity-100 h-7 w-7 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-opacity focus:opacity-100"
                          aria-label={`Remove ${day.name}`}
                          tabIndex={0}
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Add New Custom Day Button/Form */}
                {!isAdding ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-white dark:bg-gray-800/60 border-2 border-dashed border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400 h-auto py-3 rounded-lg shadow-sm transition-all duration-200"
                    onClick={() => dispatch({ type: 'SET_IS_ADDING', payload: true })}
                    onKeyDown={handleCustomDaysKeyDown}
                    aria-expanded={isAdding}
                    aria-controls="custom-day-form"
                    tabIndex={0}
                  >
                    <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    Add Custom Day Off
                  </Button>
                ) : (
                  <div
                    id="custom-day-form"
                    className="bg-white dark:bg-gray-800/60 p-4 rounded-lg border border-gray-200 dark:border-gray-700/50 shadow-sm space-y-4"
                    role="form"
                    aria-label="Add new custom day off"
                  >
                    <fieldset className="space-y-4">
                      <legend className="sr-only">Custom day off details</legend>

                      {/* Name Input */}
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-sm font-medium text-gray-900 dark:text-white">Name of
                          Custom Day Off</Label>
                        <Input
                          id="name"
                          name="customDayName"
                          value={newCustomDay.name}
                          onChange={(e) => handleCustomDayUpdate('name', e.target.value)}
                          placeholder="e.g., Summer Fridays"
                          className={cn(
                            'h-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-violet-500 dark:focus:border-violet-400 dark:text-gray-100 dark:placeholder-gray-500 text-sm',
                            errors.customDay?.name && 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500',
                          )}
                          aria-required="true"
                          aria-invalid={!!errors.customDay?.name}
                          aria-errormessage={errors.customDay?.name ? 'name-error' : undefined}
                        />
                        {errors.customDay?.name && (
                          <p id="name-error" role="alert" className="text-xs text-red-500 dark:text-red-400 mt-1">
                            {errors.customDay.name}
                          </p>
                        )}
                      </div>

                      {/* Type Selection */}
                      <fieldset className="grid grid-cols-2 gap-3">
                        <legend className="sr-only">Day off type</legend>
                        <Button
                          type="button"
                          name="dayType"
                          value="single"
                          variant="outline"
                          role="radio"
                          aria-checked={!newCustomDay.isRecurring}
                          tabIndex={0}
                          className={cn(
                            'relative border-2 h-auto py-3 px-3 flex flex-col items-center gap-1.5 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-all duration-200',
                            !newCustomDay.isRecurring
                              ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-500 dark:border-violet-400 shadow-sm'
                              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
                          )}
                          onClick={() => handleCustomDayUpdate('isRecurring', false)}
                        >
                          <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">Single Day</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">One-time occurrence</div>
                          </div>
                          {!newCustomDay.isRecurring && (
                            <span className="absolute top-1.5 right-1.5" aria-label="Selected">
                              <CalendarCheck className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                            </span>
                          )}
                        </Button>
                        <Button
                          type="button"
                          name="dayType"
                          value="recurring"
                          variant="outline"
                          role="radio"
                          aria-checked={newCustomDay.isRecurring}
                          tabIndex={0}
                          className={cn(
                            'relative border-2 h-auto py-3 px-3 flex flex-col items-center gap-1.5 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-all duration-200',
                            newCustomDay.isRecurring
                              ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-500 dark:border-violet-400 shadow-sm'
                              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
                          )}
                          onClick={() => handleCustomDayUpdate('isRecurring', true)}
                        >
                          <CalendarDays className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">Recurring Pattern</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">Repeats weekly</div>
                          </div>
                          {newCustomDay.isRecurring && (
                            <span className="absolute top-1.5 right-1.5" aria-label="Selected">
                              <CalendarCheck className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                            </span>
                          )}
                        </Button>
                      </fieldset>

                      {/* Recurring or Single Day Fields */}
                      {newCustomDay.isRecurring ? (
                        <fieldset className="space-y-4">
                          <legend className="sr-only">Recurring day details</legend>
                          <div className="space-y-2">
                            <Label id="weekday-label" className="text-sm font-medium text-gray-900 dark:text-white">Select
                              Day of Week</Label>
                            <div
                              className="grid grid-cols-7 gap-1.5"
                              role="radiogroup"
                              aria-labelledby="weekday-label"
                            >
                              {WEEKDAYS.map((day, index) => (
                                <Button
                                  key={day.value}
                                  type="button"
                                  variant="outline"
                                  role="radio"
                                  aria-checked={newCustomDay.weekday === parseInt(day.value)}
                                  tabIndex={newCustomDay.weekday === parseInt(day.value) ? 0 : -1}
                                  className={cn(
                                    'border h-8 px-1 hover:bg-violet-50/50 dark:hover:bg-violet-900/20 transition-all duration-200',
                                    newCustomDay.weekday === parseInt(day.value)
                                      ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-500 dark:border-violet-400 shadow-sm'
                                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
                                  )}
                                  onClick={() => handleCustomDayUpdate('weekday', parseInt(day.value))}
                                  onKeyDown={(e) => handleWeekdayKeyDown(e, index)}
                                  data-weekday-index={index}
                                >
                                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                                    {day.label.slice(0, 3)}
                                  </span>
                                </Button>
                              ))}
                            </div>
                            {errors.customDay?.weekday && (
                              <p role="alert" className="text-xs text-red-500 dark:text-red-400 mt-1">
                                {errors.customDay.weekday}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="startDate"
                                     className="text-sm font-medium text-gray-900 dark:text-white">Start Date</Label>
                              <div className="relative">
                                <Input
                                  id="startDate"
                                  name="startDate"
                                  type="date"
                                  value={newCustomDay.startDate}
                                  onChange={(e) => handleCustomDayUpdate('startDate', e.target.value)}
                                  className={cn(
                                    'h-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-violet-500 dark:focus:border-violet-400 dark:text-gray-100 pl-8 text-sm',
                                    errors.customDay?.startDate && 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500',
                                  )}
                                  aria-required="true"
                                  aria-invalid={!!errors.customDay?.startDate}
                                  aria-errormessage={errors.customDay?.startDate ? 'startDate-error' : undefined}
                                />
                                <Calendar
                                  className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500"
                                  aria-hidden="true" />
                              </div>
                              {errors.customDay?.startDate && (
                                <p id="startDate-error" role="alert"
                                   className="text-xs text-red-500 dark:text-red-400 mt-1">
                                  {errors.customDay.startDate}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="endDate" className="text-sm font-medium text-gray-900 dark:text-white">End
                                Date</Label>
                              <div className="relative">
                                <Input
                                  id="endDate"
                                  name="endDate"
                                  type="date"
                                  value={newCustomDay.endDate}
                                  onChange={(e) => handleCustomDayUpdate('endDate', e.target.value)}
                                  className={cn(
                                    'h-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-violet-500 dark:focus:border-violet-400 dark:text-gray-100 pl-8 text-sm',
                                    errors.customDay?.endDate && 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500',
                                  )}
                                  aria-required="true"
                                  aria-invalid={!!errors.customDay?.endDate}
                                  aria-errormessage={errors.customDay?.endDate ? 'endDate-error' : undefined}
                                />
                                <Calendar
                                  className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500"
                                  aria-hidden="true" />
                              </div>
                              {errors.customDay?.endDate && (
                                <p id="endDate-error" role="alert"
                                   className="text-xs text-red-500 dark:text-red-400 mt-1">
                                  {errors.customDay.endDate}
                                </p>
                              )}
                            </div>
                          </div>
                        </fieldset>
                      ) : (
                        /* Single Date */
                        <div className="space-y-1.5">
                          <Label htmlFor="date" className="text-sm font-medium text-gray-900 dark:text-white">Select
                            Date</Label>
                          <div className="relative">
                            <Input
                              id="date"
                              name="date"
                              type="date"
                              value={newCustomDay.date}
                              onChange={(e) => handleCustomDayUpdate('date', e.target.value)}
                              className={cn(
                                'h-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-violet-500 dark:focus:border-violet-400 dark:text-gray-100 pl-8 text-sm',
                                errors.customDay?.date && 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500',
                              )}
                              aria-required="true"
                              aria-invalid={!!errors.customDay?.date}
                              aria-errormessage={errors.customDay?.date ? 'date-error' : undefined}
                            />
                            <Calendar
                              className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-violet-400 dark:text-violet-500"
                              aria-hidden="true" />
                          </div>
                          {errors.customDay?.date && (
                            <p id="date-error" role="alert" className="text-xs text-red-500 dark:text-red-400 mt-1">
                              {errors.customDay.date}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Form Actions */}
                      <div
                        className="flex gap-2 pt-2"
                        role="group"
                        aria-label="Form actions"
                      >
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 h-8 border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-xs"
                          onClick={() => {
                            dispatch({ type: 'RESET_NEW_CUSTOM_DAY' });
                            dispatch({ type: 'SET_IS_ADDING', payload: false });
                          }}
                          tabIndex={0}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          className={cn(
                            'flex-1 h-8 text-white dark:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-xs',
                            'bg-violet-500 hover:bg-violet-600 dark:bg-violet-400 dark:hover:bg-violet-300',
                          )}
                          onClick={handleCustomDayAdd}
                          disabled={!newCustomDay.name || (newCustomDay.isRecurring ? (!newCustomDay.startDate || !newCustomDay.endDate || newCustomDay.weekday === undefined) : !newCustomDay.date)}
                          aria-label="Add custom day off"
                          tabIndex={0}
                        >
                          Add Day Off
                        </Button>
                      </div>
                    </fieldset>
                  </div>
                )}
              </div>
            </section>

            {/* Public Holidays Section */}
            <section
              className="bg-white/90 dark:bg-gray-800/60 rounded-lg p-2.5 ring-1 ring-amber-900/5 dark:ring-amber-300/10"
              aria-labelledby="holidays-heading"
            >
              <header className="mb-4">
                <h2 id="holidays-heading" className="text-xs font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  Public Holidays
                </h2>
                <p className="text-[10px] text-gray-600 dark:text-gray-300 mt-0.5">
                  Select dates from the calendar below or use quick selection options.
                </p>
              </header>

              <div className="space-y-6">
                {/* Calendar Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {format(new Date(currentYear, currentMonth), 'MMMM yyyy')}
                    </h3>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handlePrevMonth}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleNextMonth}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <MonthCalendarSelector
                    selectedDates={selectedDates}
                    onDateSelect={handleDateSelect}
                    month={currentMonth}
                    year={currentYear}
                  />
                </div>

                {/* Selected Dates List */}
                {holidays.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-medium text-gray-900 dark:text-white">
                        Selected Dates ({holidays.length})
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        onClick={() => dispatch({ type: 'CLEAR_HOLIDAYS' })}
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="pr-2 -mr-2">
                      <ul className="grid gap-1.5" aria-label="Selected holidays">
                        {holidays.map((holiday, index) => (
                          <li
                            key={index}
                            className="group flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800/60 rounded-md border border-gray-200 dark:border-gray-700/50"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 text-center font-medium text-amber-600 dark:text-amber-400">
                                {format(parse(holiday.date, 'yyyy-MM-dd', new Date()), 'd')}
                              </div>
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {format(parse(holiday.date, 'yyyy-MM-dd', new Date()), 'MMMM yyyy')}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleHolidayRemove(index)}
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        <footer className="mt-6">
          <Button
            type="submit"
            disabled={isLoading || !days || parseInt(days) <= 0}
            className={cn(
              'w-full',
              'bg-violet-500 hover:bg-violet-600 dark:bg-violet-400 dark:hover:bg-violet-500',
              'text-white dark:text-gray-900',
              'h-10 rounded-lg',
              'transition-colors',
              'shadow-sm',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-violet-400 dark:focus:ring-violet-300 focus:ring-offset-2',
            )}
            aria-label={isLoading ? 'Optimizing your calendar...' : 'Optimize your calendar'}
          >
            <span className="flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Optimizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span>Optimize Calendar</span>
                </>
              )}
            </span>
          </Button>
        </footer>
      </form>
    </main>
  );
} 