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
    <dl className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-10 md:mt-12">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="font-body text-xs font-semibold text-oboya-blue-dark">
            {item.label}
          </dt>
          <dd className="mt-2 font-body text-sm font-medium text-oboya-green md:text-[0.9375rem]">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
