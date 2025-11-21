import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "@tanstack/react-router";

export function SiteHeader() {
	const router = useRouter();

	return (
		<header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<ArrowLeft
					onClick={() => router.history.back()}
					className="cursor-pointer hover:opacity-80"
				/>

				<Separator
					orientation="vertical"
					className="mx-2 data-[orientation=vertical]:h-4"
				/>
			</div>
		</header>
	);
}
