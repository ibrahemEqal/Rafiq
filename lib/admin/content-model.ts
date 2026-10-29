export type AdminField = { key: string; label: [string, string]; kind?: 'textarea' | 'select' | 'course'; options?: string[]; min?: number; max?: number; nullable?: boolean };
const field = (key: string, ar: string, en: string, config: Omit<AdminField, 'key' | 'label'> = {}): AdminField => ({ key, label: [ar, en], ...config });
const title = field('title', 'العنوان', 'Title', { min: 3, max: 160 });
const description = field('description', 'الوصف', 'Description', { kind: 'textarea', max: 8000, nullable: true });
const course = (nullable = false) => field('course_id', 'المساق', 'Course', { kind: 'course', nullable });
const body = field('body', 'المحتوى', 'Content', { kind: 'textarea', min: 2, max: 8000 });
const names = [field('name_ar', 'الاسم بالعربية', 'Arabic name', { min: 2, max: 200 }), field('name_en', 'الاسم بالإنجليزية', 'English name', { min: 2, max: 200 })];
const slug = field('slug', 'اسم الرابط', 'URL name', { min: 2, max: 160 });
const options = (key: string, ar: string, en: string, values: string[]) => field(key, ar, en, { kind: 'select', options: values });
export const contentEntities = {
  curated_resources: { label: ['موارد متطلبات الجامعة', 'University requirement links'], fields: [title,options('type','النوع','Type',['previous_exam','summary','lecture','assignment','notes','other']),field('url','الرابط','Link',{min:10,max:1200}),field('course_name_ar','اسم المادة بالعربية (لكل مواردها)','Arabic course name (all its links)',{min:2,max:200}),field('course_name_en','اسم المادة بالإنجليزية (لكل مواردها)','English course name (all its links)',{min:2,max:200})] },
  resources: { label: ['الموارد التعليمية', 'Resources'], fields: [title, description, course(), options('type', 'النوع', 'Type', ['previous_exam', 'summary', 'lecture', 'assignment', 'notes', 'other']), field('external_url', 'رابط المورد الخارجي', 'External resource link', { max: 1200, nullable: true })] },
  books: { label: ['سوق الكتب', 'Book market'], fields: [title, description, options('type','النوع','Type',['book','printed_slides']),options('status','الحالة','Status',['available','taken']),field('whatsapp_number','رقم واتساب','WhatsApp number',{ min: 8, max: 20 })] },
  requests: { label: ['الطلبات', 'Requests'], fields: [field('title','العنوان','Title',{ min:5,max:140 }),field('description','الوصف','Description',{kind:'textarea',min:10,max:2000,nullable:true}),course(true),options('type','النوع','Type',['book','resource','other']),options('status','الحالة','Status',['open','fulfilled','closed'])] },
  questions: { label: ['الأسئلة', 'Questions'], fields: [field('title','العنوان','Title',{ min:5,max:160 }),course(true),field('body','المحتوى','Content',{kind:'textarea', min:10,max:8000})] },
  answers: { label: ['الإجابات', 'Answers'], fields: [body] },
  answer_comments: { label: ['التعليقات', 'Comments'], fields: [field('body','التعليق','Comment',{kind:'textarea',min:2,max:1000})] },
  request_responses: { label: ['ردود الطلبات', 'Request responses'], fields: [field('body','الرد','Response',{kind:'textarea',min:2,max:1000}),field('whatsapp_number','رقم واتساب','WhatsApp number',{max:20,nullable:true})] },
  campus_circles: { label: ['الدوائر واللقاءات', 'Circles and gatherings'], fields: [field('title','العنوان','Title',{min:5,max:120}),field('description','الوصف','Description',{kind:'textarea',min:10,max:1200}),field('location','مكان اللقاء','Meeting location',{min:3,max:120}),options('kind','نوع اللقاء','Meeting kind',['study','exchange','break']),options('status','الحالة','Status',['open','closed'])] },
  profiles: { label: ['المستخدمون والصلاحيات', 'Users and access'], fields: [field('full_name','الاسم الكامل','Full name',{min:2,max:100}),field('username','اسم المستخدم','Username',{min:3,max:30}),options('role','الصلاحية','Role',['student','admin'])] },
  universities: { label: ['الجامعات', 'Universities'], fields: [...names,slug] },
  colleges: { label: ['الكليات', 'Colleges'], fields: [...names,slug] },
  majors: { label: ['التخصصات', 'Majors'], fields: [...names,slug] },
  courses: { label: ['المساقات', 'Courses'], fields: [...names,field('code','رمز المساق','Course code',{min:1,max:100}),field('description_ar','الوصف بالعربية','Arabic description',{kind:'textarea',max:8000,nullable:true}),field('description_en','الوصف بالإنجليزية','English description',{kind:'textarea',max:8000,nullable:true})] },
} satisfies Record<string, { label: [string,string]; fields: AdminField[] }>;
export type ContentEntity = keyof typeof contentEntities;
export type ContentRow = { id: string; version: string; values: Record<string, string | null> };
export type ContentPage = { rows: ContentRow[]; total: number };
export type ContentError = 'unauthorized' | 'invalid' | 'conflict' | 'dependencies' | 'ownAccess' | 'migration' | 'failed';
export function isContentEntity(value: unknown): value is ContentEntity {
  return typeof value === 'string' && Object.hasOwn(contentEntities, value);
}
export const optionLabels: Record<string, [string,string]> = {
  study:['دراسة','Study'],exchange:['تبادل','Exchange'],break:['استراحة','Break'],pending:['بانتظار المراجعة','Pending'],approved:['معتمد','Approved'],rejected:['مرفوض','Rejected'],removed:['مخفي','Removed'],previous_exam: ['امتحانات وكويزات','Exams and quizzes'], summary:['تلاخيص','Summaries'], lecture:['محاضرات وسلايدات','Lectures and slides'], assignment:['واجبات','Assignments'],notes:['ملاحظات','Notes'],other:['أخرى','Other'],book:['كتاب','Book'],printed_slides:['سلايدات مطبوعة','Printed slides'],available:['متاح','Available'],taken:['تم تسليمه','Taken'],open:['مفتوح','Open'],fulfilled:['تم تلبيته','Fulfilled'],closed:['مغلق','Closed'],student:['طالب','Student'],admin:['مدير الموقع','Administrator'],
};
