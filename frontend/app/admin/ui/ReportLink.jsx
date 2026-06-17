'use client'
import Link from 'next/link'

/**
 * "Open in Reports" deep-link — jumps to the Reports page pre-selected to a
 * specific report (and optional date range), ready to filter / export / print.
 * Drop into a page's PageHeader actions.
 *
 * @param {string} report  report key (e.g. 'orders-detail')
 * @param {string} [label]
 */
export default function ReportLink({ report, label = 'Reports & print' }) {
    return (
        <Link href={`/admin/reports?report=${encodeURIComponent(report)}`} className="ui-btn ui-btn-ghost">
            <svg viewBox="0 0 24 24" fill="none" className="size-4 stroke-current" strokeWidth={1.7}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
            </svg>
            {label}
        </Link>
    )
}
