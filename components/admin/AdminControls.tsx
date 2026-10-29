'use client';
import { useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { CheckCheck, LoaderCircle, Pencil, Trash2, X } from 'lucide-react';
import { approveAllPendingResources, mutateAdminContent, findAdminCourses } from '@/lib/actions/admin-content';
import { contentEntities, optionLabels, type AdminField, type ContentEntity, type ContentError, type ContentRow } from '@/lib/admin/content-model';

const button = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50 disabled:cursor-wait';
const input = 'w-full rounded-xl border border-line bg-paper p-3 text-ink focus:outline-forest';
function message(error: ContentError, ar: boolean) {
  const texts: Record<ContentError, [string,string]> = {
    unauthorized:['صلاحية المدير مطلوبة. أعد تسجيل الدخول.','Administrator access required. Sign in again.'],
    invalid:['تحقق من القيم وطول النصوص والروابط.','Check field values, text lengths and links.'],
    conflict:['تغيّر السجل منذ فتحه. حدّث الصفحة وأعد المحاولة.','This record changed. Refresh the page and try again.'],
    dependencies:['هذا السجل مرتبط ببيانات أخرى. عالج ارتباطاته قبل الحذف.','This record has dependent data. Handle its dependencies before deleting.'],
    ownAccess:['لا يمكنك حذف حسابك أو تغيير صلاحيتك من هنا، أو إزالة آخر مدير.','You cannot delete your own account, change your own role, or remove the last administrator.'],
    migration:['تحديث قاعدة بيانات لوحة الإدارة لم يُطبّق بعد.','The administration database update has not been applied yet.'],
    failed:['تعذّر تنفيذ العملية. لم نؤكد نجاحها؛ حدّث الصفحة قبل إعادة المحاولة.','Could not confirm the operation. Refresh before trying again.'],
  };
  return texts[error][ar ? 0 : 1];
}
export function ApproveAllResources({ count }: {count:number}) {
  const ar = useLocale()==='ar';
  const [pending,startTransition] = useTransition();
  const [notice,setNotice] = useState('');
  const [error,setError] = useState<ContentError|null>(null);
  return <div className="rounded-2xl border border-line bg-paper p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="max-w-2xl text-sm leading-7 text-muted">{ar ? 'الموافقة الجماعية تشمل كل الموارد المعلّقة، وليس الصفحة الحالية فقط. ستظهر للطلاب بعد الاعتماد.' : 'Bulk approval includes every pending resource, beyond this page. Approved resources become visible to students.'}</p>
      <button type="button" disabled={pending || count===0} className={`${button} bg-forest text-white`} onClick={()=>{
        if(!window.confirm(ar ? `اعتماد جميع الموارد المعلّقة؟ العدد المعروض ${count}. يشمل ما بقي معلّقًا عند التنفيذ، وقد يتغير العدد.` : `Approve all pending resources? Displayed count: ${count}. The count may change before execution.`))return;
        setError(null);setNotice('');
        startTransition(async()=>{
          try {
            const result=await approveAllPendingResources();
            if('error'in result)setError(result.error);
            else setNotice(ar ? `تم اعتماد ${result.count} موردًا.` : `Approved ${result.count} resources.`);
          } catch {setError('failed');}
        });
      }}>{pending?<LoaderCircle size={18} className="animate-spin"/>:<CheckCheck size={18}/>} {ar ? `موافقة على الكل (${count})` : `Approve all (${count})`}</button>
    </div>
    {notice&&<p role="status" className="mt-3 font-bold text-forest">{notice}</p>}
    {error&&<p role="alert" className="mt-3 text-red-700">{message(error,ar)}</p>}
  </div>;
}
function CoursePicker({field,row,ar}:{field:AdminField;row:ContentRow;ar:boolean}) {
  const [value,setValue]=useState(row.values.course_id??'');
  const [label,setLabel]=useState(row.values[ar?'_course_name_ar':'_course_name_en']??'');
  const [query,setQuery]=useState('');
  const [options,setOptions]=useState<ContentRow[]>([]);
  const [pending,startTransition]=useTransition();
  const [error,setError]=useState(false);
  return <div className="space-y-2">
    <input type="hidden" name={field.key} value={value}/>
    <p className="text-sm text-muted">{ar?'المساق الحالي: ':'Current course: '}{label||(ar?'بدون مساق':'No course')}</p>
    <div className="flex gap-2"><input aria-label={ar?'ابحث عن مساق بديل':'Search for a replacement course'} value={query} onChange={event=>setQuery(event.target.value)} maxLength={100} className={input}/><button type="button" disabled={pending} className={`${button} bg-sage-soft`} onClick={()=>startTransition(async()=>{
      setError(false);try{const result=await findAdminCourses(query);if('error'in result)setError(true);else setOptions(result.rows);}catch{setError(true);}
    })}>{ar?'ابحث':'Search'}</button></div>
    <select aria-label={ar?'نتائج المساقات':'Course results'} value="" onChange={event=>{
      const choice=options.find(x=>x.id===event.target.value);if(choice){setValue(choice.id);setLabel(choice.values[ar?'name_ar':'name_en']??'');}
    }} className={input}><option value="">{ar?'اختر المساق من نتائج البحث':'Choose a course from search results'}</option>{options.map(option=><option key={option.id} value={option.id}>{option.values[ar?'name_ar':'name_en']} · {option.values.code}</option>)}</select>
    {field.nullable&&<button type="button" className="text-sm underline" onClick={()=>{setValue('');setLabel('');}}>{ar?'إزالة ربط المساق':'Clear course'}</button>}
    {error&&<p role="alert" className="text-red-700">{ar?'تعذّر تحميل المساقات.':'Could not load courses.'}</p>}
  </div>;
}
export function ContentRecords({entity,rows,currentUserId}:{entity:ContentEntity;rows:ContentRow[];currentUserId:string}) {
  const ar=useLocale()==='ar';const lang=ar?0:1;
  const router=useRouter();
  const [editing,setEditing]=useState<string|null>(null);
  const [pending,startTransition]=useTransition();
  const [error,setError]=useState<ContentError|null>(null);
  const [notice,setNotice]=useState('');
  const fields:AdminField[]=contentEntities[entity].fields;
  function submit(row:ContentRow,operation:'update'|'delete',form?:HTMLFormElement) {
    const patch:Record<string,string|null>={};
    if(form){const values=new FormData(form);for(const field of fields){
      if(!values.has(field.key))continue;
      const value=String(values.get(field.key)??'').trim();
      const next=field.nullable&&!value?null:value;
      if(next!==(row.values[field.key]??null))patch[field.key]=next;
    }}
    if(operation==='update'&&!Object.keys(patch).length){setEditing(null);return;}
    const label=row.values.title||row.values.name_ar||row.values.full_name||row.values.body?.slice(0,70)||'';
    if(operation==='delete'&&!window.confirm(ar ? `حذف «${label}» نهائيًا؟ ${entity==='profiles'?'سيُحذف حساب تسجيل الدخول ومحتواه المرتبط.':entity==='questions'?'ستُحذف الإجابات والتفاعلات المرتبطة بالسؤال.':'قد تُحذف التفاعلات والردود المرتبطة أيضًا.'} لا يمكن التراجع من الواجهة.` : `Permanently delete “${label}”? ${entity==='profiles'?'The sign-in account and associated content will be deleted.':'Associated replies and interactions may also be deleted.'} This cannot be undone from the interface.`))return;
    if(patch.role&&!window.confirm(ar?`تغيير صلاحية هذا المستخدم إلى «${optionLabels[patch.role]?.[0]??patch.role}»؟`:`Change this user's role to ${patch.role}?`))return;
    setError(null);setNotice('');
    startTransition(async()=>{
      try{const result=await mutateAdminContent({entity,id:row.id,version:row.version,operation,patch});
        if('error'in result){setError(result.error);if(result.error==='conflict')router.refresh();}
        else {setEditing(null);setNotice(ar?'تم حفظ العملية.':'Changes saved.');}
      }catch{setError('failed');}
    });
  }
  return <div className="space-y-4">
    {notice&&<p role="status" className="rounded-xl bg-sage-soft p-4 font-bold text-forest">{notice}</p>}
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{message(error,ar)}</p>}
    {rows.map(row=><article key={row.id} className="rounded-2xl border border-line bg-paper p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 dir="auto" className="break-words text-lg font-bold text-ink">{row.values.title||row.values[ar?'name_ar':'name_en']||row.values.full_name||row.values.body?.slice(0,160)}</h2>
          {row.values._course_name_ar&&<p className="mt-1 text-sm text-muted">{row.values[ar?'_course_name_ar':'_course_name_en']}</p>}
          {row.values.username&&<p className="mt-1 text-sm text-muted">@{row.values.username}</p>}
          {row.values.description&&<p dir="auto" className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-7 text-muted">{row.values.description}</p>}
          {row.values.role&&<p className="mt-2 text-sm font-bold text-forest">{optionLabels[row.values.role]?.[lang]}</p>}
          {row.values.status&&<p className="mt-2 text-sm font-bold text-forest">{optionLabels[row.values.status]?.[lang]??row.values.status}</p>}
        </div>
        <div className="flex gap-2">
          <button type="button" className={`${button} bg-sage-soft text-forest`} disabled={pending} onClick={()=>{setEditing(editing===row.id?null:row.id);setError(null);}}><Pencil size={16}/>{ar?'تعديل':'Edit'}</button>
          <button type="button" className={`${button} bg-red-50 text-red-700`} disabled={pending||(entity==='profiles'&&row.id===currentUserId)} onClick={()=>submit(row,'delete')}><Trash2 size={16}/>{ar?'حذف':'Delete'}</button>
        </div>
      </div>
      {editing===row.id&&<form key={row.version} className="mt-5 space-y-4 border-t border-line pt-5" onSubmit={event=>{event.preventDefault();submit(row,'update',event.currentTarget);}}>
        {fields.filter(field=>field.key!=='external_url'||row.values.source_type==='external').map(field=><div key={field.key} className="block space-y-2 text-sm font-bold text-ink">
          <label htmlFor={`${row.id}-${field.key}`}>{field.label[lang]}</label>
          {field.kind==='course'?<CoursePicker field={field} row={row} ar={ar}/>:field.kind==='textarea'?<textarea id={`${row.id}-${field.key}`} name={field.key} defaultValue={row.values[field.key]??''} minLength={field.min} maxLength={field.max} required={Boolean(field.min)&&!field.nullable} rows={4} className={input}/>:
          field.kind==='select'?<select id={`${row.id}-${field.key}`} name={field.key} defaultValue={row.values[field.key]??''} disabled={pending||(entity==='profiles'&&row.id===currentUserId&&field.key==='role')} className={input}>{field.options?.map(option=><option key={option} value={option}>{optionLabels[option]?.[lang]??option}</option>)}</select>:
          <input id={`${row.id}-${field.key}`} name={field.key} type={['external_url','url'].includes(field.key)?'url':'text'} defaultValue={row.values[field.key]??''} minLength={field.min} maxLength={field.max} required={Boolean(field.min)&&!field.nullable} className={input}/>}
        </div>)}
        <div className="flex gap-2"><button type="submit" disabled={pending} className={`${button} bg-forest text-white`}>{pending?<LoaderCircle size={16} className="animate-spin"/>:null}{ar?'حفظ التعديلات':'Save changes'}</button><button type="button" disabled={pending} onClick={()=>setEditing(null)} className={`${button} border border-line`}><X size={16}/>{ar?'إلغاء':'Cancel'}</button></div>
      </form>}
    </article>)}
    {!rows.length&&<p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">{ar?'لا توجد سجلات مطابقة.':'No matching records.'}</p>}
  </div>;
}
