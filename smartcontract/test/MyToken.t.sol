// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {MyToken} from "../src/MyToken.sol";

contract MyTokenTest is Test {
    MyToken public token;

    address public owner;
    address public alice;
    address public bob;
    address public charlie;

    uint8 constant DECIMALS = 18;
    uint256 constant INITIAL_SUPPLY = 1000000 * 10 ** 18;

    event AddressAllowlisted(address indexed account);
    event AddressRemovedFromAllowlist(address indexed account);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    function setUp() public {
        owner = address(this);
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        charlie = makeAddr("charlie");

        token = new MyToken("MyToken", "MTK", DECIMALS, INITIAL_SUPPLY);
    }

    // ============ Constructor Tests ============

    function test_Constructor() public {
        assertEq(token.name(), "MyToken");
        assertEq(token.symbol(), "MTK");
        assertEq(token.decimals(), DECIMALS);
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY);
        assertEq(token.owner(), owner);
        assertTrue(token.isAllowlisted(owner));
        assertEq(token.getAllowlistLength(), 1);
    }

    // ============ Allowlist Management Tests ============

    function test_AddToAllowlist() public {
        vm.expectEmit(true, false, false, false);
        emit AddressAllowlisted(alice);

        token.addToAllowlist(alice);

        assertTrue(token.isAllowlisted(alice));
        assertEq(token.getAllowlistLength(), 2);
        assertEq(token.getAllowlistAddress(1), alice);
    }

    function test_AddToAllowlist_MultipleAddresses() public {
        token.addToAllowlist(alice);
        token.addToAllowlist(bob);
        token.addToAllowlist(charlie);

        assertEq(token.getAllowlistLength(), 4);
        assertTrue(token.isAllowlisted(alice));
        assertTrue(token.isAllowlisted(bob));
        assertTrue(token.isAllowlisted(charlie));
    }

    function test_RevertWhen_AddToAllowlist_NotOwner() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                alice
            )
        );
        token.addToAllowlist(bob);
    }

    function test_RevertWhen_AddToAllowlist_AlreadyAllowlisted() public {
        token.addToAllowlist(alice);

        vm.expectRevert("Address already allowlisted");
        token.addToAllowlist(alice);
    }

    function test_RemoveFromAllowlist() public {
        token.addToAllowlist(alice);
        assertTrue(token.isAllowlisted(alice));

        vm.expectEmit(true, false, false, false);
        emit AddressRemovedFromAllowlist(alice);

        token.removeFromAllowlist(alice);

        assertFalse(token.isAllowlisted(alice));
        assertEq(token.getAllowlistLength(), 1);
    }

    function test_RevertWhen_RemoveFromAllowlist_NotOwner() public {
        token.addToAllowlist(alice);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                alice
            )
        );
        token.removeFromAllowlist(alice);
    }

    function test_RevertWhen_RemoveFromAllowlist_NotInAllowlist() public {
        vm.expectRevert("Address not in allowlist");
        token.removeFromAllowlist(alice);
    }

    function test_GetAllowlistAddress() public {
        token.addToAllowlist(alice);
        token.addToAllowlist(bob);

        assertEq(token.getAllowlistAddress(0), owner);
        assertEq(token.getAllowlistAddress(1), alice);
        assertEq(token.getAllowlistAddress(2), bob);
    }

    // ============ Transfer Tests ============

    function test_Transfer_BothAllowlisted() public {
        token.addToAllowlist(alice);

        uint256 amount = 1000 * 10 ** 18;

        vm.expectEmit(true, true, false, true);
        emit Transfer(owner, alice, amount);

        bool success = token.transfer(alice, amount);

        assertTrue(success);
        assertEq(token.balanceOf(alice), amount);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - amount);
    }

    function test_RevertWhen_Transfer_SenderNotAllowlisted() public {
        token.addToAllowlist(alice);
        token.addToAllowlist(bob);
        token.transfer(alice, 1000 * 10 ** 18);

        // Owner removes alice from allowlist
        token.removeFromAllowlist(alice);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature("NotAllowlisted(address)", alice)
        );
        token.transfer(bob, 500 * 10 ** 18);
    }

    function test_RevertWhen_Transfer_RecipientNotAllowlisted() public {
        vm.expectRevert(
            abi.encodeWithSignature("NotAllowlisted(address)", alice)
        );
        token.transfer(alice, 1000 * 10 ** 18);
    }

    // ============ TransferFrom Tests ============

    function test_TransferFrom_AllAllowlisted() public {
        token.addToAllowlist(alice);
        token.addToAllowlist(bob);

        uint256 amount = 1000 * 10 ** 18;
        token.transfer(alice, amount);

        vm.prank(alice);
        token.approve(bob, amount);

        vm.expectEmit(true, true, false, true);
        emit Transfer(alice, bob, amount);

        vm.prank(bob);
        bool success = token.transferFrom(alice, bob, amount);

        assertTrue(success);
        assertEq(token.balanceOf(bob), amount);
        assertEq(token.balanceOf(alice), 0);
    }

    function test_RevertWhen_TransferFrom_FromNotAllowlisted() public {
        token.addToAllowlist(alice);
        token.addToAllowlist(bob);

        uint256 amount = 1000 * 10 ** 18;
        token.transfer(alice, amount);

        vm.prank(alice);
        token.approve(bob, amount);

        token.removeFromAllowlist(alice);

        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSignature("NotAllowlisted(address)", alice)
        );
        token.transferFrom(alice, bob, amount);
    }

    function test_RevertWhen_TransferFrom_ToNotAllowlisted() public {
        token.addToAllowlist(alice);

        uint256 amount = 1000 * 10 ** 18;
        token.transfer(alice, amount);

        vm.prank(alice);
        token.approve(owner, amount);

        vm.expectRevert(
            abi.encodeWithSignature("NotAllowlisted(address)", bob)
        );
        token.transferFrom(alice, bob, amount);
    }

    // ============ Approve Tests ============

    function test_Approve_BothAllowlisted() public {
        token.addToAllowlist(alice);

        uint256 amount = 1000 * 10 ** 18;

        vm.expectEmit(true, true, false, true);
        emit Approval(owner, alice, amount);

        bool success = token.approve(alice, amount);

        assertTrue(success);
        assertEq(token.allowance(owner, alice), amount);
    }

    function test_RevertWhen_Approve_OwnerNotAllowlisted() public {
        token.addToAllowlist(alice);
        token.addToAllowlist(bob);
        token.transfer(alice, 1000 * 10 ** 18);

        token.removeFromAllowlist(alice);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature("NotAllowlisted(address)", alice)
        );
        token.approve(bob, 500 * 10 ** 18);
    }

    function test_RevertWhen_Approve_SpenderNotAllowlisted() public {
        vm.expectRevert(
            abi.encodeWithSignature("NotAllowlisted(address)", alice)
        );
        token.approve(alice, 1000 * 10 ** 18);
    }

    function test_RevertWhen_Approve_WhenPaused() public {
        token.addToAllowlist(alice);
        token.pause();

        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        token.approve(alice, 1000 * 10 ** 18);
    }

    // ============ Mint Tests ============

    function test_Mint() public {
        token.addToAllowlist(alice);

        uint256 mintAmount = 1000 * 10 ** 18;
        uint256 initialSupply = token.totalSupply();

        vm.expectEmit(true, true, false, true);
        emit Transfer(address(0), alice, mintAmount);

        token.mint(alice, mintAmount);

        assertEq(token.balanceOf(alice), mintAmount);
        assertEq(token.totalSupply(), initialSupply + mintAmount);
    }

    function test_RevertWhen_Mint_NotOwner() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                alice
            )
        );
        token.mint(alice, 1000 * 10 ** 18);
    }

    // ============ Burn Tests ============

    function test_Burn() public {
        uint256 burnAmount = 1000 * 10 ** 18;
        uint256 initialBalance = token.balanceOf(owner);
        uint256 initialSupply = token.totalSupply();

        vm.expectEmit(true, true, false, true);
        emit Transfer(owner, address(0), burnAmount);

        token.burn(burnAmount);

        assertEq(token.balanceOf(owner), initialBalance - burnAmount);
        assertEq(token.totalSupply(), initialSupply - burnAmount);
    }

    function test_RevertWhen_Burn_NotAllowlisted() public {
        token.addToAllowlist(alice);
        token.transfer(alice, 1000 * 10 ** 18);

        token.removeFromAllowlist(alice);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature("NotAllowlisted(address)", alice)
        );
        token.burn(500 * 10 ** 18);
    }

    function test_RevertWhen_Burn_InsufficientBalance() public {
        token.addToAllowlist(alice);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature(
                "ERC20InsufficientBalance(address,uint256,uint256)",
                alice,
                0,
                1000
            )
        );
        token.burn(1000);
    }

    // ============ Pause/Unpause Tests ============

    function test_Pause() public {
        token.pause();
        assertTrue(token.paused());
    }

    function test_Unpause() public {
        token.pause();
        token.unpause();
        assertFalse(token.paused());
    }

    function test_RevertWhen_Pause_NotOwner() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                alice
            )
        );
        token.pause();
    }

    function test_RevertWhen_Unpause_NotOwner() public {
        token.pause();

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                alice
            )
        );
        token.unpause();
    }

    function test_RevertWhen_Transfer_WhenPaused() public {
        token.addToAllowlist(alice);
        token.pause();

        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        token.transfer(alice, 1000 * 10 ** 18);
    }

    function test_RevertWhen_TransferFrom_WhenPaused() public {
        token.addToAllowlist(alice);
        token.addToAllowlist(bob);

        token.transfer(alice, 1000 * 10 ** 18);

        vm.prank(alice);
        token.approve(bob, 1000 * 10 ** 18);

        token.pause();

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        token.transferFrom(alice, bob, 500 * 10 ** 18);
    }

    // ============ Integration Tests ============

    function test_CompleteWorkflow() public {
        // Add users to allowlist
        token.addToAllowlist(alice);
        token.addToAllowlist(bob);

        // Transfer tokens
        token.transfer(alice, 5000 * 10 ** 18);
        assertEq(token.balanceOf(alice), 5000 * 10 ** 18);

        // Approve and transferFrom
        vm.prank(alice);
        token.approve(bob, 2000 * 10 ** 18);

        vm.prank(bob);
        token.transferFrom(alice, bob, 1500 * 10 ** 18);
        assertEq(token.balanceOf(bob), 1500 * 10 ** 18);
        assertEq(token.balanceOf(alice), 3500 * 10 ** 18);

        // Burn tokens
        vm.prank(alice);
        token.burn(500 * 10 ** 18);
        assertEq(token.balanceOf(alice), 3000 * 10 ** 18);

        // Mint new tokens
        token.mint(bob, 1000 * 10 ** 18);
        assertEq(token.balanceOf(bob), 2500 * 10 ** 18);

        // Remove from allowlist and verify transfers fail
        token.removeFromAllowlist(bob);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature("NotAllowlisted(address)", bob)
        );
        token.transfer(bob, 100 * 10 ** 18);
    }

    function test_PauseUnpauseWorkflow() public {
        token.addToAllowlist(alice);

        // Normal operation
        token.transfer(alice, 1000 * 10 ** 18);
        assertEq(token.balanceOf(alice), 1000 * 10 ** 18);

        // Pause
        token.pause();

        // Transfers should fail
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        token.transfer(alice, 500 * 10 ** 18);

        // Unpause
        token.unpause();

        // Transfers should work again
        token.transfer(alice, 500 * 10 ** 18);
        assertEq(token.balanceOf(alice), 1500 * 10 ** 18);
    }

    // ============ Fuzz Tests ============

    function testFuzz_AddToAllowlist(address user) public {
        vm.assume(user != address(0));
        vm.assume(user != owner);

        token.addToAllowlist(user);
        assertTrue(token.isAllowlisted(user));
    }

    function testFuzz_Transfer(address to, uint256 amount) public {
        vm.assume(to != address(0));
        vm.assume(to != owner);
        vm.assume(amount > 0 && amount <= INITIAL_SUPPLY);

        token.addToAllowlist(to);
        token.transfer(to, amount);

        assertEq(token.balanceOf(to), amount);
    }

    function testFuzz_Mint(address to, uint256 amount) public {
        vm.assume(to != address(0));
        vm.assume(to != owner); // Avoid trying to re-add owner to allowlist
        vm.assume(amount < type(uint256).max - INITIAL_SUPPLY);

        token.addToAllowlist(to);

        uint256 initialSupply = token.totalSupply();
        token.mint(to, amount);

        assertEq(token.balanceOf(to), amount);
        assertEq(token.totalSupply(), initialSupply + amount);
    }

    function testFuzz_Burn(uint256 amount) public {
        vm.assume(amount <= INITIAL_SUPPLY);

        uint256 initialSupply = token.totalSupply();
        token.burn(amount);

        assertEq(token.totalSupply(), initialSupply - amount);
    }

    // ============ Decimals Tests ============

    function test_CustomDecimals_6() public {
        MyToken token6 = new MyToken(
            "SixDecimals",
            "SIX",
            6,
            1000000 * 10 ** 6
        );

        assertEq(token6.decimals(), 6);
        assertEq(token6.totalSupply(), 1000000 * 10 ** 6);
        assertEq(token6.balanceOf(address(this)), 1000000 * 10 ** 6);
    }

    function test_CustomDecimals_8() public {
        MyToken token8 = new MyToken(
            "EightDecimals",
            "EIGHT",
            8,
            21000000 * 10 ** 8
        );

        assertEq(token8.decimals(), 8);
        assertEq(token8.totalSupply(), 21000000 * 10 ** 8);
    }

    function test_CustomDecimals_0() public {
        MyToken token0 = new MyToken("NoDecimals", "ZERO", 0, 1000000);

        assertEq(token0.decimals(), 0);
        assertEq(token0.totalSupply(), 1000000);
    }

    function testFuzz_CustomDecimals(uint8 decimals_) public {
        vm.assume(decimals_ <= 59); // Upper limit to avoid overflow (max safe: 10^77 / 1000000 ≈ 10^71)

        uint256 supply = decimals_ > 0 ? 1000000 * (10 ** decimals_) : 1000000;
        MyToken customToken = new MyToken(
            "Custom",
            "CUSTOM",
            decimals_,
            supply
        );

        assertEq(customToken.decimals(), decimals_);
        assertEq(customToken.totalSupply(), supply);
        assertEq(customToken.balanceOf(address(this)), supply);
        assertTrue(customToken.isAllowlisted(address(this)));
    }
}
