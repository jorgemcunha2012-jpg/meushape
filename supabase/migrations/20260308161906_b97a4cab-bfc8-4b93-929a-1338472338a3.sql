
-- Allow authenticated users to manage workout content (for now, open for building)
CREATE POLICY "Authenticated can insert programs" ON public.workout_programs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update programs" ON public.workout_programs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete programs" ON public.workout_programs FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can insert workouts" ON public.workouts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update workouts" ON public.workouts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete workouts" ON public.workouts FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can insert exercises" ON public.exercises FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update exercises" ON public.exercises FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete exercises" ON public.exercises FOR DELETE TO authenticated USING (true);
