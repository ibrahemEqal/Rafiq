import { getLocale } from 'next-intl/server';
import UniversityResources from './UniversityResources';
import { createPublicClient } from '@/lib/supabase/public';
import type defaultCourses from '@/data/university-resources.json';
export default async function ManagedUniversityResources() {
  const {data,error}=await createPublicClient().from('curated_resources')
    .select('course_slug,course_name_ar,course_name_en,title,type,url').order('created_at').order('id');
  if(error) {
    // Rollout compatibility only. Other failures must not resurrect deleted links.
    if(['42P01','PGRST205'].includes(error.code))return <UniversityResources/>;
    const ar=(await getLocale())==='ar';
    return <p role="status" className="mb-8 rounded-2xl border border-line p-5 text-muted">{ar?'تعذّر تحميل روابط متطلبات الجامعة حاليًا.':'University requirement links are temporarily unavailable.'}</p>;
  }
  const courses:typeof defaultCourses=[];
  for(const row of data??[]) {
    let course=courses.find(x=>x.slug===row.course_slug);
    if(!course){course={slug:row.course_slug,name_ar:row.course_name_ar,name_en:row.course_name_en,resources:[]};courses.push(course);}
    course.resources.push({title:row.title,type:row.type,url:row.url});
  }
  return <UniversityResources courses={courses}/>;
}
