"use client"
import * as React from "react"
import { toast } from "sonner"
import {
  IconBallFootball,
  IconCalendar,
  IconSearch,
  IconSettings,
  IconShield,
  IconStar,
} from "@tabler/icons-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
const Section = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <Separator />
      {children}
    </section>
  )
}
const Subsection = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}
const DesignSystemPage = () => {
  const [progress, setProgress] = React.useState(60)
  const [sliderValue, setSliderValue] = React.useState([50])
  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((previous) => (previous >= 100 ? 0 : previous + 10))
    }, 1500)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-6 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Design System</h1>
        <p className="mt-2 text-muted-foreground">
          Visual reference for all shadcn/ui components with the Campeonato
          Uruguayo theme.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Preset{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            b1Z5bbEiO
          </code>{" "}
          — Style: radix-vega — Base: neutral — Primary: blue — Font: Roboto —
          Radius: 0.625rem
        </p>
      </div>

      
      
      
      <Section title="Colors">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {[
            { name: "Background", className: "bg-background border" },
            { name: "Foreground", className: "bg-foreground" },
            { name: "Primary", className: "bg-primary" },
            { name: "Secondary", className: "bg-secondary" },
            { name: "Muted", className: "bg-muted" },
            { name: "Accent", className: "bg-accent" },
            { name: "Destructive", className: "bg-destructive" },
            { name: "Card", className: "bg-card border" },
            { name: "Popover", className: "bg-popover border" },
            { name: "Border", className: "bg-border" },
            { name: "Input", className: "bg-input" },
            { name: "Ring", className: "bg-ring" },
          ].map((color) => (
            <div key={color.name} className="space-y-1.5">
              <div className={`h-12 rounded-lg ${color.className}`} />
              <p className="text-xs text-muted-foreground">{color.name}</p>
            </div>
          ))}
        </div>
        <Subsection title="Chart Colors">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="space-y-1.5">
                <div
                  className={`h-10 w-16 rounded-md bg-chart-${index}`}
                  style={{ backgroundColor: `var(--chart-${index})` }}
                />
                <p className="text-xs text-muted-foreground">Chart {index}</p>
              </div>
            ))}
          </div>
        </Subsection>
      </Section>

      
      
      
      <Section title="Typography">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-4xl font-bold tracking-tight">
              Heading 4XL Bold
            </p>
            <p className="text-3xl font-bold tracking-tight">
              Heading 3XL Bold
            </p>
            <p className="text-2xl font-semibold tracking-tight">
              Heading 2XL Semibold
            </p>
            <p className="text-xl font-semibold tracking-tight">
              Heading XL Semibold
            </p>
            <p className="text-lg font-medium">Heading LG Medium</p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-base">
              Body base — The quick brown fox jumps over the lazy dog.
            </p>
            <p className="text-sm">
              Body sm — The quick brown fox jumps over the lazy dog.
            </p>
            <p className="text-xs">
              Body xs — The quick brown fox jumps over the lazy dog.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Muted — Secondary information text
            </p>
            <p className="font-mono text-sm">Mono — 0123456789 ABCDEF</p>
          </div>
        </div>
      </Section>

      
      
      
      <Section title="Button">
        <Subsection title="Variants">
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
        </Subsection>
        <Subsection title="Sizes">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="xs">Extra Small</Button>
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </Subsection>
        <Subsection title="Icon Sizes">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="icon-xs">
              <IconStar />
            </Button>
            <Button size="icon-sm">
              <IconStar />
            </Button>
            <Button size="icon">
              <IconStar />
            </Button>
            <Button size="icon-lg">
              <IconStar />
            </Button>
          </div>
        </Subsection>
        <Subsection title="With Icons">
          <div className="flex flex-wrap gap-3">
            <Button>
              <IconBallFootball data-icon="inline-start" /> New Match
            </Button>
            <Button variant="outline">
              <IconSearch data-icon="inline-start" /> Search
            </Button>
            <Button variant="secondary">
              <IconSettings data-icon="inline-start" /> Settings
            </Button>
          </div>
        </Subsection>
        <Subsection title="States">
          <div className="flex flex-wrap gap-3">
            <Button disabled>Disabled</Button>
            <Button variant="outline" disabled>
              Disabled Outline
            </Button>
          </div>
        </Subsection>
        <Subsection title="Button Group">
          <ButtonGroup>
            <Button variant="outline">Apertura</Button>
            <Button variant="outline">Clausura</Button>
            <Button variant="outline">Anual</Button>
          </ButtonGroup>
        </Subsection>
      </Section>

      
      
      
      <Section title="Badge">
        <div className="flex flex-wrap gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="ghost">Ghost</Badge>
        </div>
        <Subsection title="Football Context">
          <div className="flex flex-wrap gap-3">
            <Badge>Finished</Badge>
            <Badge variant="secondary">Upcoming</Badge>
            <Badge variant="outline">Postponed</Badge>
            <Badge variant="destructive">Cancelled</Badge>
            <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
              Yellow Card
            </Badge>
            <Badge className="bg-red-500/10 text-red-600 dark:text-red-400">
              Red Card
            </Badge>
            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
              Goal
            </Badge>
          </div>
        </Subsection>
      </Section>

      
      
      
      <Section title="Card">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Nacional vs Peñarol</CardTitle>
              <CardDescription>Apertura — Round 12</CardDescription>
              <CardAction>
                <Badge>Finished</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-2xl font-bold">
                <span>2</span>
                <span className="text-sm font-normal text-muted-foreground">
                  -
                </span>
                <span>1</span>
              </div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              <IconCalendar className="mr-1.5 size-4" />
              15 Mar 2026, 20:00
            </CardFooter>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Top Scorer</CardTitle>
              <CardDescription>Apertura 2026</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>LG</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Luis García</p>
                  <p className="text-sm text-muted-foreground">12 goals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      
      
      
      <Section title="Table">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">PJ</TableHead>
                <TableHead className="text-center">G</TableHead>
                <TableHead className="text-center">E</TableHead>
                <TableHead className="text-center">P</TableHead>
                <TableHead className="text-right">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  pos: 1,
                  team: "Nacional",
                  played: 12,
                  won: 9,
                  drawn: 2,
                  lost: 1,
                  points: 29,
                },
                {
                  pos: 2,
                  team: "Peñarol",
                  played: 12,
                  won: 8,
                  drawn: 3,
                  lost: 1,
                  points: 27,
                },
                {
                  pos: 3,
                  team: "Defensor Sporting",
                  played: 12,
                  won: 7,
                  drawn: 2,
                  lost: 3,
                  points: 23,
                },
                {
                  pos: 4,
                  team: "Liverpool",
                  played: 12,
                  won: 6,
                  drawn: 3,
                  lost: 3,
                  points: 21,
                },
                {
                  pos: 5,
                  team: "Wanderers",
                  played: 12,
                  won: 5,
                  drawn: 4,
                  lost: 3,
                  points: 19,
                },
              ].map((row) => (
                <TableRow key={row.pos}>
                  <TableCell className="font-medium">{row.pos}</TableCell>
                  <TableCell>{row.team}</TableCell>
                  <TableCell className="text-center">{row.played}</TableCell>
                  <TableCell className="text-center">{row.won}</TableCell>
                  <TableCell className="text-center">{row.drawn}</TableCell>
                  <TableCell className="text-center">{row.lost}</TableCell>
                  <TableCell className="text-right font-bold">
                    {row.points}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>

      
      
      
      <Section title="Tabs">
        <Subsection title="Default">
          <Tabs defaultValue="apertura">
            <TabsList>
              <TabsTrigger value="apertura">Apertura</TabsTrigger>
              <TabsTrigger value="clausura">Clausura</TabsTrigger>
              <TabsTrigger value="anual">Anual</TabsTrigger>
            </TabsList>
            <TabsContent value="apertura">
              <p className="text-sm text-muted-foreground">
                Apertura tournament standings and fixtures.
              </p>
            </TabsContent>
            <TabsContent value="clausura">
              <p className="text-sm text-muted-foreground">
                Clausura tournament standings and fixtures.
              </p>
            </TabsContent>
            <TabsContent value="anual">
              <p className="text-sm text-muted-foreground">
                Annual aggregate table.
              </p>
            </TabsContent>
          </Tabs>
        </Subsection>
        <Subsection title="Line Variant">
          <Tabs defaultValue="overview">
            <TabsList variant="line">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="lineups">Lineups</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <p className="text-sm text-muted-foreground">
                Match overview with score and key events.
              </p>
            </TabsContent>
          </Tabs>
        </Subsection>
      </Section>

      
      
      
      <Section title="Inputs & Forms">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Subsection title="Input">
              <Input placeholder="Search players..." />
            </Subsection>
            <Subsection title="Textarea">
              <Textarea placeholder="Match notes..." />
            </Subsection>
            <Subsection title="Select">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>
            </Subsection>
            <Subsection title="Native Select">
              <NativeSelect>
                <NativeSelectOption value="">Select round</NativeSelectOption>
                <NativeSelectOption value="1">Round 1</NativeSelectOption>
                <NativeSelectOption value="2">Round 2</NativeSelectOption>
                <NativeSelectOption value="3">Round 3</NativeSelectOption>
              </NativeSelect>
            </Subsection>
          </div>
          <div className="space-y-4">
            <Subsection title="Checkbox">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="finished" defaultChecked />
                  <Label htmlFor="finished">Finished matches</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="upcoming" />
                  <Label htmlFor="upcoming">Upcoming matches</Label>
                </div>
              </div>
            </Subsection>
            <Subsection title="Radio Group">
              <RadioGroup defaultValue="all">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">All positions</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="forward" id="forward" />
                  <Label htmlFor="forward">Forward</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="midfielder" id="midfielder" />
                  <Label htmlFor="midfielder">Midfielder</Label>
                </div>
              </RadioGroup>
            </Subsection>
            <Subsection title="Switch">
              <div className="flex items-center gap-2">
                <Switch id="dark-mode" />
                <Label htmlFor="dark-mode">Dark mode</Label>
              </div>
            </Subsection>
            <Subsection title="Slider">
              <div className="space-y-2">
                <Label>Min. rating: {sliderValue[0]}</Label>
                <Slider
                  value={sliderValue}
                  onValueChange={setSliderValue}
                  max={100}
                  step={1}
                />
              </div>
            </Subsection>
          </div>
        </div>
      </Section>

      
      
      
      <Section title="Avatar">
        <div className="flex items-center gap-4">
          <Avatar size="sm">
            <AvatarFallback>NA</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>PE</AvatarFallback>
          </Avatar>
          <Avatar size="lg">
            <AvatarFallback>DS</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage src="https://unavailable.example" alt="Player" />
            <AvatarFallback>LG</AvatarFallback>
          </Avatar>
        </div>
      </Section>

      
      
      
      <Section title="Alert">
        <div className="space-y-3">
          <Alert>
            <IconBallFootball className="size-4" />
            <AlertTitle>Match day</AlertTitle>
            <AlertDescription>
              Nacional vs Peñarol kicks off at 20:00 tonight.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Match postponed</AlertTitle>
            <AlertDescription>
              The fixture has been postponed due to weather conditions.
            </AlertDescription>
          </Alert>
        </div>
      </Section>

      
      
      
      <Section title="Dialog & Sheet">
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter Fixtures</DialogTitle>
                <DialogDescription>
                  Select filters to narrow down the fixture list.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Season</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select season" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Reset</Button>
                <Button>Apply Filters</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Player Details</SheetTitle>
                <SheetDescription>
                  Full player profile and statistics.
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    <AvatarFallback>LG</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Luis García</p>
                    <p className="text-sm text-muted-foreground">
                      Forward — Nacional
                    </p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Section>

      
      
      
      <Section title="Dropdown, Tooltip & Hover Card">
        <div className="flex flex-wrap gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Match Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem>View lineups</DropdownMenuItem>
              <DropdownMenuItem>View statistics</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                Report issue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Match starts in 2 hours</p>
            </TooltipContent>
          </Tooltip>

          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link">@nacional</Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-64">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>NA</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    Club Nacional de Football
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Founded 1899 — Montevideo
                  </p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </Section>

      
      
      
      <Section title="Accordion">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Match Events</AccordionTrigger>
            <AccordionContent>
              Goals, cards, substitutions and other key events during the match.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Lineups</AccordionTrigger>
            <AccordionContent>
              Starting XI and substitutes for both teams.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Player Statistics</AccordionTrigger>
            <AccordionContent>
              Detailed per-player stats: passes, shots, tackles, duels.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      
      
      
      <Section title="Breadcrumb & Pagination">
        <Subsection title="Breadcrumb">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Teams</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Nacional</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </Subsection>
        <Subsection title="Pagination">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </Subsection>
      </Section>

      
      
      
      <Section title="Toggle & Toggle Group">
        <Subsection title="Toggle">
          <div className="flex gap-3">
            <Toggle aria-label="Toggle star">
              <IconStar className="size-4" />
            </Toggle>
            <Toggle variant="outline" aria-label="Toggle shield">
              <IconShield className="size-4" />
            </Toggle>
          </div>
        </Subsection>
        <Subsection title="Toggle Group">
          <ToggleGroup type="single" defaultValue="home">
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="home">Home</ToggleGroupItem>
            <ToggleGroupItem value="away">Away</ToggleGroupItem>
          </ToggleGroup>
        </Subsection>
      </Section>

      
      
      
      <Section title="Progress, Spinner & Skeleton">
        <Subsection title="Progress">
          <Progress value={progress} />
        </Subsection>
        <Subsection title="Spinner">
          <div className="flex items-center gap-3">
            <Spinner />
            <span className="text-sm text-muted-foreground">
              Loading match data...
            </span>
          </div>
        </Subsection>
        <Subsection title="Skeleton">
          <div className="flex items-center gap-4">
            <Skeleton className="size-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </Subsection>
      </Section>

      
      
      
      <Section title="Empty State">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconBallFootball />
            </EmptyMedia>
            <EmptyTitle>No matches found</EmptyTitle>
            <EmptyDescription>
              There are no fixtures scheduled for this round yet.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Section>

      
      
      
      <Section title="Scroll Area">
        <ScrollArea className="h-48 w-full rounded-md border p-4">
          <div className="space-y-2">
            {Array.from({ length: 20 }, (_, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>Round {index + 1}</span>
                <Badge variant="secondary">{(index % 5) + 3} matches</Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Section>

      
      
      
      <Section title="Keyboard">
        <div className="flex items-center gap-2">
          <Kbd>D</Kbd>
          <span className="text-sm text-muted-foreground">
            Toggle dark mode
          </span>
        </div>
      </Section>

      
      
      
      <Section title="Toast (Sonner)">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => toast("Match data synced successfully.")}
          >
            Default Toast
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.success("Standings updated.")}
          >
            Success Toast
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.error("Failed to load fixture details.")}
          >
            Error Toast
          </Button>
        </div>
      </Section>

      
      
      
      <Section title="Separator">
        <div className="space-y-3">
          <p className="text-sm">Horizontal separator:</p>
          <Separator />
          <div className="flex h-8 items-center gap-3">
            <span className="text-sm">Apertura</span>
            <Separator orientation="vertical" />
            <span className="text-sm">Clausura</span>
            <Separator orientation="vertical" />
            <span className="text-sm">Anual</span>
          </div>
        </div>
      </Section>
    </div>
  )
}
export default DesignSystemPage
