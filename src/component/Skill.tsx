import { Text, Slider, Flex, Box, Center, Image, Stack } from '@mantine/core'
import { THEME } from '@/theme'
import { type Characters, type Costumes } from '@/validation'
import { useCharactersStore } from '@/stores'
import {
	toLowerCaseReplaceSpaceAndHyphenRemoveSpecialChars,
	replaceVariablePlaceholders,
} from '@/utils'

const replaceComputedPlaceholders = (inputString: string) => {
	return inputString.replace(/<<([^>>]+)>>/g, () => {
		return ' ? '
	})
}

const rangeColors = {
	light: { 1: '#A69038', 2: '#E0BF4C' },
	dark: { 1: '#7E4CBB', 2: '#BE7EFF' },
	fire: { 1: ' #C62828', 2: '#FF4241' },
	water: { 1: '#007ACC', 2: '#41BFFF' },
	wind: { 1: '#009966', 2: '#28D58E' },
} as const
const boxSize = 6

export const Skill = ({
	character,
	costume,
}: {
	character: Characters
	costume: Costumes
}) => {
	const upgrade = useCharactersStore(
		state => state.slider.skill[costume.name] || 0
	)
	const marks = Object.values(costume.skill.variables)[0] || []

	return (
		<Stack p="xs" pt="lg" pb="xl" align="center" gap="xl">
			<Flex justify="start" w="100%" gap="xs">
				<Image
					src={`/icons/skills/${character.name.toLowerCase()}/${toLowerCaseReplaceSpaceAndHyphenRemoveSpecialChars(costume.skill.name)}.png`}
					h="3.5em"
				/>
				<Text ta="left" size="2em" fs="italic">
					{costume.skill.name}
				</Text>
				<Image
					src={`/icons/skills/upgrade_${upgrade}.png`}
					h="3.5em"
					w="3.5em"
				/>
			</Flex>
			<Flex justify="center" gap="xl">
				<Flex direction="column" justify="center" gap={0}>
					{costume.skill.range.map((item, i) => {
						return (
							<Flex justify="center" key={i} gap={0}>
								{item.map((num, j) => {
									const size = `${boxSize / 3}em`
									return (
										<Box
											bg={
												num
													? rangeColors[character.element][num]
													: 'transparent'
											}
											key={j}
											h={size}
											w={size}
											style={{
												border: 'solid',
												borderWidth: '2px',
											}}
										/>
									)
								})}
							</Flex>
						)
					})}
				</Flex>
				<Center
					style={{
						border: 'solid',
					}}
					bg="black"
					h={`${boxSize}em`}
					w={`${boxSize}em`}
				>
					<Text
						ta="center"
						lineClamp={2}
						tt="capitalize"
						fw="bold"
						size="xl"
						c={rangeColors[character.element]['2']}
					>
						{costume.skill.target}
					</Text>
				</Center>
			</Flex>
			<Flex justify="center" gap="xl">
				<Text
					size="1.5em"
					c={
						costume.skill.costs[upgrade]! < costume.skill.costs[upgrade - 1]!
							? 'red'
							: 'black'
					}
				>
					Cost: {costume.skill.costs[upgrade]} SP
				</Text>
				<Text
					size="1.5em"
					c={
						costume.skill.cool_down[upgrade]! <
						costume.skill.cool_down[upgrade - 1]!
							? 'red'
							: 'black'
					}
				>
					CD: {costume.skill.cool_down[upgrade]} turns
				</Text>
			</Flex>
			<Text ta="left" size="1.5em" px="xl">
				{replaceComputedPlaceholders(
					replaceVariablePlaceholders(
						costume.skill.description,
						costume.skill.variables,
						upgrade
					)
				)}
			</Text>
			<Slider
				value={upgrade}
				onChange={value => {
					useCharactersStore.setState(state => {
						state.slider.skill[costume.name] = value
					})
				}}
				color="blue"
				min={0}
				max={marks.length - 1}
				step={1}
				w="auto"
				miw="20em"
				py="xl"
				marks={Array.from({
					length: marks.length || 0,
				}).map((_, index) => {
					return {
						value: index,
						label: <Text size="xl">+{index}</Text>,
					}
				})}
				styles={{
					markLabel: {
						color: 'black',
						fontSize: THEME.fontSizes.xl,
						textAlign: 'center',
					},
				}}
			/>
		</Stack>
	)
}
