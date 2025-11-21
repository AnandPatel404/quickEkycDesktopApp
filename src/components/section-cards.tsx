import { useEffect, useState } from "react";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import useUserStore, {
	type UserStateInterface,
	type Settings,
} from "@/store/dashboard";
import { Link } from "@tanstack/react-router";

export function SectionCards() {
	const [data, setData] = useState<Settings[]>([]);
	const dashboard = useUserStore(
		(state) => (state as UserStateInterface).dashboard,
	);

	useEffect(() => {
		const fetchDashboardData = async () => {
			const response = (await dashboard()) as unknown as Settings[];
			if (response) setData(response);
		};
		fetchDashboardData();
	}, [dashboard]);

	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{data.length > 0
				? data.map((item, index) => (
						<Link
							to="/details/$id"
							key={index}
							params={{ id: String(item.id) }}
						>
							<Card className="@container/card">
								<CardHeader className="relative">
									<CardDescription>
										Service name
									</CardDescription>
									<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
										{item.name}
									</CardTitle>
								</CardHeader>
								<CardFooter className="flex-col items-start gap-1 text-sm">
									<div className="text-muted-foreground">
										{item.desc}
									</div>
								</CardFooter>
							</Card>
						</Link>
					))
				: null}
		</div>
	);
}
