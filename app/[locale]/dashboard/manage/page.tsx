import { getLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link, redirect } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { getAdminAccess } from '@/lib/admin/resource-review';
import { listContentWithClient } from '@/lib/admin/content-management';
import { contentEntities, isContentEntity } from '@/lib/admin/content-model';
import { ContentRecords } from '@/components/admin/AdminControls';

export default async function ManagePage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const [locale,params,client]=await Promise.all([getLocale(),searchParams,createClient()]);
  const access=await getAdminAccess(client);
  if(!access.userId)redirect({href:'/auth/login',locale});
  if(!access.isAdmin)notFound();
  const ar=locale==='ar';const lang=ar?0:1;
  const entity=isContentEntity(params.entity)?params.entity:'resources';
  const query=typeof params.q==='string'?params.q.trim().slice(0,100):'';
  const page=typeof params.page==='string'&&/^\d{1,5}$/.test(params.page)?Math.max(1,Number(params.page)):1;
  const result=await listContentWithClient(client,entity,query,page);
  const totalPages='error'in result?1:Math.max(1,Math.ceil(result.total/20));
  if(!('error'in result)&&page>totalPages)redirect({href:{pathname:'/dashboard/manage',query:{entity,q:query,page:totalPages}},locale});
  return <section className="min-h-screen bg-canvas px-4 py-8 sm:py-12"><div className="mx-auto max-w-6xl space-y-6">
    <header className="rounded-3xl bg-forest p-6 text-white sm:p-8">
      <Link href="/dashboard" className="text-sm font-bold text-mist">{ar?'العودة للداشبورد':'Back to dashboard'}</Link>
      <h1 className="mt-4 text-3xl font-bold">{ar?'إدارة محتوى رفيق':'Manage Rafiq content'}</h1>
      <p className="mt-3 leading-8 text-mist">{ar?'عدّل الأسماء والبيانات، وأدر المحتوى والمستخدمين والكتالوج. التعديلات والحذف والاعتماد الجماعي محفوظة في سجل تدقيق.':'Edit names and details, manage content, users and the catalog. Edits, deletions and bulk approvals are recorded in an audit log.'}</p>
    </header>
    <nav aria-label={ar?'أقسام الإدارة':'Administration sections'} className="flex flex-wrap gap-2">
      {Object.entries(contentEntities).map(([key,value])=><Link key={key} href={{pathname:'/dashboard/manage',query:{entity:key}}} aria-current={entity===key?'page':undefined} className={`rounded-xl border border-line px-4 py-2.5 text-sm font-bold ${entity===key?'bg-forest text-white':'bg-paper text-ink'}`}>{value.label[lang]}</Link>)}
    </nav>
    <form className="flex gap-3" method="get"><input type="hidden" name="entity" value={entity}/><label className="flex-1"><span className="sr-only">{ar?'بحث بالاسم أو المحتوى':'Search by name or content'}</span><input name="q" defaultValue={query} maxLength={100} placeholder={ar?'ابحث بالاسم أو العنوان…':'Search by name or title…'} className="w-full rounded-xl border border-line bg-paper p-3 focus:outline-forest"/></label><button className="rounded-xl bg-forest px-6 py-3 font-bold text-white">{ar?'بحث':'Search'}</button></form>
    {'error'in result?<p role="alert" className="rounded-xl bg-red-50 p-5 text-red-700">{result.error==='migration'?(ar?'شغّل تحديث قاعدة بيانات الإدارة أولًا لتفعيل هذه الصفحة.':'Apply the admin database migration to enable this page.'):(ar?'تعذّر تحميل البيانات. حاول مجددًا.':'Could not load records. Try again.')}</p>:<>
      <div className="flex justify-between text-sm text-muted"><h2 className="font-bold text-ink">{contentEntities[entity].label[lang]} ({result.total})</h2><span>{ar?`صفحة ${page} من ${totalPages}`:`Page ${page} of ${totalPages}`}</span></div>
      <ContentRecords key={`${entity}:${page}:${query}`} entity={entity} rows={result.rows} currentUserId={access.userId!}/>
      <nav aria-label={ar?'الصفحات':'Pages'} className="flex justify-between gap-3">
        {page>1?<Link href={{pathname:'/dashboard/manage',query:{entity,q:query,page:page-1}}} className="rounded-xl border border-line bg-paper px-5 py-3">{ar?'السابق':'Previous'}</Link>:<span/>}
        {page<totalPages&&<Link href={{pathname:'/dashboard/manage',query:{entity,q:query,page:page+1}}} className="rounded-xl border border-line bg-paper px-5 py-3">{ar?'التالي':'Next'}</Link>}
      </nav>
    </>}
  </div></section>;
}
