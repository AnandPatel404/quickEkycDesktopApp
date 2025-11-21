//import { type Icon } from '@tabler/icons-react';
import React from "react";
import { useLocation, Link } from "@tanstack/react-router";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({
	items,
}: {
	items: {
		title: string;
		url: string;
		icon?: React.ElementType;
	}[];
}) {
	const location = useLocation();
	const currentPath = location.pathname;

	return (
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				<SidebarMenu>
					{items.map((item) => {
						const isActive = currentPath == item.url;
						return (
							<Link to={item.url} key={item.title}>
								<SidebarMenuItem>
									<SidebarMenuButton
										tooltip={item.title}
										className={
											isActive
												? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
												: ""
										}
										style={{ cursor: "pointer" }}
									>
										{item.icon &&
											React.createElement(item.icon)}
										<span>{item.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</Link>
						);
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
