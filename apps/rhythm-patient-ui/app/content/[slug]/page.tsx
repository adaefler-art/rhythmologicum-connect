import { redirect } from 'next/navigation'

type PageProps = {
  params: Promise<{ slug: string }>
}


export default async function ContentPage({ params }: PageProps) {
  const { slug } = await params
  redirect(`/patient/content/${slug}`)
}
