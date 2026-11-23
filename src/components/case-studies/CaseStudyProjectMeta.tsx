interface CaseStudyProjectMetaProps {
  clientLabel: string;
  client: string;
  industryLabel: string;
  industry: string;
  countryLabel: string;
  country: string;
}

export function CaseStudyProjectMeta({
  clientLabel,
  client,
  industryLabel,
  industry,
  countryLabel,
  country,
}: CaseStudyProjectMetaProps) {
  const items = [
    { label: clientLabel, value: client },
    { label: industryLabel, value: industry },
    { label: countryLabel, value: country },
  ].filter((item) => item.value);

  if (items.length === 0) return null;

  return (
    <dl className="mt-10 grid gap-6 sm:grid-cols-3 sm:gap-10 md:mt-12">
      {items.map((item) => (
        <div key={item.label} className="border-l border-oboya-green/60 pl-4 md:pl-5">
          <dt className="font-body text-[0.9375rem] font-semibold text-oboya-blue-dark">
            {item.label}:
          </dt>
          <dd className="mt-1 font-body text-[0.9375rem] text-oboya-green">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
